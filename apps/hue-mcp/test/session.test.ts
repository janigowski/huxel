import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hexToXy } from 'hue-app';
import type { DiscoveredBridge, HttpRequest } from 'hue-sdk';
import { ConfigStore } from '../src/config/config-store';
import { KEY_REJECTED, NOT_LINKED, PRESS_BUTTON } from '../src/errors';
import { HueSession } from '../src/session';
import { createFakeBridge, ENTERTAINMENT_KEY, ISSUED_KEY, type FakeBridge } from './fake-bridge';

const BRIDGE: DiscoveredBridge = { id: 'bridge-1', internalipaddress: '10.0.0.8' };

describe('HueSession', () => {
	let dir: string;

	afterEach(async () => {
		if (dir) {
			await rm(dir, { recursive: true, force: true });
		}
	});

	test('getHome fails before the bridge is linked and does not call it', async () => {
		const { session, bridge } = await setup();

		await expect(session.getHome()).rejects.toMatchObject({
			code: 'not-linked',
			message: NOT_LINKED
		});
		expect(bridge.requests).toHaveLength(0);
	});

	test('link stores the application key and not the entertainment key', async () => {
		const bridge = createFakeBridge();
		bridge.button = true;
		const { session, path } = await setup(bridge, {
			discover: async () => [BRIDGE]
		});

		await expect(session.link()).resolves.toEqual({ linked: true, bridgeId: 'bridge-1' });

		const saved = await readFile(path, 'utf8');

		expect(JSON.parse(saved)).toEqual({
			bridge: { id: 'bridge-1', ip: '10.0.0.8' },
			appKey: ISSUED_KEY
		});
		expect(saved).not.toContain(ENTERTAINMENT_KEY);
		expect(saved).not.toContain('clientkey');

		const home = await session.getHome();

		expect(home.lights.map((light) => light.name)).toEqual(['Desk']);
		expect(home.rooms[0]?.name).toBe('Office');
		expect(home.scenes[0]).toEqual({ id: 'scene-1', name: 'Concentrate', group: 'Office' });
	});

	test('link tells the caller to press the button', async () => {
		const { session } = await setup(createFakeBridge(), { discover: async () => [BRIDGE] });

		await expect(session.link()).rejects.toMatchObject({
			code: 'link-button',
			message: PRESS_BUTTON
		});
	});

	test('linkUntil retries until the button is pressed', async () => {
		const bridge = createFakeBridge();
		let time = 0;
		const { session } = await setup(bridge, {
			discover: async () => [BRIDGE],
			now: () => time,
			sleep: async (ms) => {
				time += ms;
				if (time >= 2_000) {
					bridge.button = true;
				}
			}
		});

		await expect(session.linkUntil()).resolves.toEqual({ linked: true, bridgeId: 'bridge-1' });
		expect(time).toBe(2_000);
	});

	test('several bridges require a bridge id and do not register', async () => {
		const bridge = createFakeBridge();
		const { session } = await setup(bridge, {
			discover: async () => [BRIDGE, { id: 'bridge-2', internalipaddress: '10.0.0.9' }]
		});

		await expect(session.link()).rejects.toMatchObject({
			code: 'ambiguous',
			message: 'Several bridges found: bridge-1 (10.0.0.8), bridge-2 (10.0.0.9). Pass bridgeId.'
		});
		expect(bridge.requests).toHaveLength(0);
	});

	test('an ambiguous light name does not write', async () => {
		const bridge = createFakeBridge();
		bridge.lights.push({ id: 'light-2', name: 'Desk', on: true, brightness: 10, color: null });
		const { session, store } = await setup(bridge);
		await linkStored(store);

		await expect(session.setLight({ name: 'Desk', on: true })).rejects.toMatchObject({
			code: 'ambiguous',
			message: 'Several lights are named "Desk": light-1, light-2. Pass id.'
		});
		expect(puts(bridge.requests)).toHaveLength(0);
	});

	test('setLight sends xy and turns the light on when brightness and color are set', async () => {
		const { session, bridge, store } = await setup();
		await linkStored(store);

		const state = await session.setLight({ name: 'desk', brightness: 40, color: '#ff8000' });
		const body = JSON.parse(putBody(bridge.requests));

		expect(body).toEqual({
			on: { on: true },
			dimming: { brightness: 40 },
			color: { xy: hexToXy('#ff8000') }
		});
		expect(state).toMatchObject({ id: 'light-1', name: 'Desk', on: true, brightness: 40 });
	});

	test('on false ignores brightness and color', async () => {
		const { session, bridge, store } = await setup();
		await linkStored(store);

		await session.setLight({ name: 'Desk', on: false, brightness: 80, color: '#ff0000' });

		expect(JSON.parse(putBody(bridge.requests))).toEqual({ on: { on: false } });
	});

	test('setArea writes the grouped light', async () => {
		const { session, bridge, store } = await setup();
		await linkStored(store);

		const state = await session.setArea({ name: 'Office', brightness: 20 });

		expect(
			puts(bridge.requests).some((request) =>
				request.url.endsWith('/resource/grouped_light/group-1')
			)
		).toBe(true);
		expect(JSON.parse(putBody(bridge.requests))).toEqual({
			on: { on: true },
			dimming: { brightness: 20 }
		});
		expect(state).toMatchObject({
			kind: 'room',
			id: 'room-1',
			name: 'Office',
			on: true,
			brightness: 20
		});
	});

	test('activateScene recalls the scene', async () => {
		const { session, bridge, store } = await setup();
		await linkStored(store);

		await expect(session.activateScene({ name: 'Concentrate' })).resolves.toEqual({
			id: 'scene-1',
			name: 'Concentrate',
			group: 'Office'
		});
		expect(JSON.parse(putBody(bridge.requests))).toEqual({ recall: { action: 'active' } });
	});

	test('a rejected application key is forgotten and omitted from the error', async () => {
		const bridge = createFakeBridge();
		const { session, store } = await setup(bridge);
		const secret = 'super-secret-app-key';
		await store.save({ bridge: { id: 'bridge-1', ip: '10.0.0.8' }, appKey: secret });

		const error = await session.getHome().then(
			() => {
				throw new Error('expected the key to be rejected');
			},
			(caught: unknown) => caught
		);

		expect(error).toMatchObject({ code: 'unauthorized', message: KEY_REJECTED });
		expect(error instanceof Error ? error.message : '').not.toContain(secret);

		expect(await store.load()).toEqual({ bridge: { id: 'bridge-1', ip: '10.0.0.8' } });
	});

	test('status treats a bridge timeout as unreachable', async () => {
		const bridge = createFakeBridge();
		bridge.timeout = true;
		const { session, store } = await setup(bridge);
		await store.save({ bridge: { id: 'bridge-1', ip: '10.0.0.8' }, appKey: ISSUED_KEY });

		await expect(session.status()).resolves.toEqual({
			linked: true,
			bridgeId: 'bridge-1',
			reachable: false
		});
	});

	test('status reports an unreachable bridge without dropping the key', async () => {
		const bridge = createFakeBridge();
		bridge.offline = true;
		const { session, store } = await setup(bridge);
		await store.save({ bridge: { id: 'bridge-1', ip: '10.0.0.8' }, appKey: ISSUED_KEY });

		await expect(session.status()).resolves.toEqual({
			linked: true,
			bridgeId: 'bridge-1',
			reachable: false
		});
		expect((await store.load())?.appKey).toBe(ISSUED_KEY);
	});

	test('a light name with surrounding spaces still matches', async () => {
		const bridge = createFakeBridge();
		bridge.lights[0]!.name = 'Desk ';
		const { session, store } = await setup(bridge);
		await linkStored(store);

		await expect(session.setLight({ name: 'Desk', on: true })).resolves.toMatchObject({
			name: 'Desk ',
			on: true
		});
	});

	test('a later address change is picked up after the bridge stops answering', async () => {
		const bridge = createFakeBridge();
		let ip = '10.0.0.1';
		const { session, store } = await setup(bridge, {
			discover: async () => [{ id: 'bridge-1', internalipaddress: ip }]
		});
		await store.save({ bridge: { id: 'bridge-1', ip: '10.0.0.1' }, appKey: ISSUED_KEY });

		await session.status();
		ip = '10.0.0.9';
		bridge.failHost = '10.0.0.1';

		await session.getHome();

		expect(bridge.requests.some((request) => request.url.startsWith('https://10.0.0.9/'))).toBe(
			true
		);
		expect(await store.load()).toEqual({
			bridge: { id: 'bridge-1', ip: '10.0.0.9' },
			appKey: ISSUED_KEY
		});
	});

	test('status clears a revoked key when the bridge still answers', async () => {
		const bridge = createFakeBridge();
		bridge.revoke = true;
		const { session, store } = await setup(bridge);
		await store.save({ bridge: { id: 'bridge-1', ip: '10.0.0.8' }, appKey: ISSUED_KEY });

		await expect(session.status()).resolves.toEqual({
			linked: false,
			bridgeId: 'bridge-1',
			reachable: true
		});
		expect(await store.load()).toEqual({ bridge: { id: 'bridge-1', ip: '10.0.0.8' } });
	});

	test('status clears a key when the bridge answers 403', async () => {
		const bridge = createFakeBridge();
		bridge.revoke = true;
		bridge.unauthorizedStatus = 403;
		const { session, store } = await setup(bridge);
		await store.save({ bridge: { id: 'bridge-1', ip: '10.0.0.8' }, appKey: ISSUED_KEY });

		await expect(session.status()).resolves.toEqual({
			linked: false,
			bridgeId: 'bridge-1',
			reachable: true
		});
		expect(await store.load()).toEqual({ bridge: { id: 'bridge-1', ip: '10.0.0.8' } });
	});

	test('a discovered address replaces a stale stored address and keeps the key', async () => {
		const bridge = createFakeBridge();
		const { session, store } = await setup(bridge, {
			discover: async () => [{ id: 'bridge-1', internalipaddress: '10.0.0.9' }]
		});
		await store.save({ bridge: { id: 'bridge-1', ip: '10.0.0.1' }, appKey: ISSUED_KEY });

		await session.getHome();

		expect(bridge.requests.every((request) => request.url.startsWith('https://10.0.0.9/'))).toBe(
			true
		);
		expect(await store.load()).toEqual({
			bridge: { id: 'bridge-1', ip: '10.0.0.9' },
			appKey: ISSUED_KEY
		});
	});

	async function setup(
		bridge = createFakeBridge(),
		options: {
			discover?: () => Promise<DiscoveredBridge[]>;
			now?: () => number;
			sleep?: (ms: number) => Promise<void>;
		} = {}
	) {
		dir = await mkdtemp(join(tmpdir(), 'hue-mcp-session-'));
		const path = join(dir, 'config.json');
		const store = new ConfigStore(path);
		const session = new HueSession({
			env: {},
			store,
			discover: options.discover ?? (async () => []),
			httpClient: bridge.http,
			...(options.now ? { now: options.now } : {}),
			...(options.sleep ? { sleep: options.sleep } : {})
		});

		return { session, bridge, store, path };
	}
});

async function linkStored(store: ConfigStore): Promise<void> {
	await store.save({ bridge: { id: 'bridge-1', ip: '10.0.0.8' }, appKey: ISSUED_KEY });
}

function puts(requests: HttpRequest[]): HttpRequest[] {
	return requests.filter((request) => request.method === 'PUT');
}

function putBody(requests: HttpRequest[]): string {
	const body = puts(requests).at(-1)?.body;

	if (body === undefined) {
		throw new Error('No PUT body');
	}

	return body;
}
