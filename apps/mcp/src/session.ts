import {
	createHueClient,
	discoverBridges,
	HueError,
	HueForbiddenError,
	HueLinkButtonNotPressedError,
	HueNetworkError,
	HueUnauthorizedError,
	registerApplication,
	type ApiResponse,
	type DiscoveredBridge,
	type HttpClient
} from '@huxel/client';
import { bridgeBaseUrl, readBridgeEnv, sameBridge, type BridgeAddress } from './bridge/address';
import { createBridgeHttpClient } from './bridge/http-client';
import { ConfigStore, defaultConfigPath } from './config/config-store';
import { KEY_REJECTED, NOT_LINKED, PRESS_BUTTON, SessionError, UNREACHABLE } from './errors';
import {
	groupedServiceId,
	groupNames,
	lightCommand,
	mapHome,
	selectArea,
	selectLight,
	selectScene,
	targetFromArea,
	targetFromLight,
	type HomeSnapshot,
	type SceneActivation,
	type TargetChange,
	type TargetState
} from './home';

const APPLICATION_NAME = 'hue-mcp';
const DEVICE_NAME = 'local';
const LINK_WINDOW_MS = 30_000;
const LINK_RETRY_MS = 1_000;

export interface BridgeStatus {
	linked: boolean;
	bridgeId: string | null;
	reachable: boolean;
}

export interface LinkResult {
	linked: true;
	bridgeId: string;
}

export interface HueSessionOptions {
	env: Record<string, string | undefined>;
	store: ConfigStore;
	discover: () => Promise<DiscoveredBridge[]>;
	httpClient?: HttpClient;
	now?: () => number;
	sleep?: (ms: number) => Promise<void>;
	linkWindowMs?: number;
}

interface LoadedBridge {
	bridge?: BridgeAddress;
	appKey?: string;
	fromEnv: boolean;
}

export class HueSession {
	private addressRefreshed = false;

	constructor(private readonly options: HueSessionOptions) {}

	async status(): Promise<BridgeStatus> {
		const loaded = await this.load();

		if (!loaded.bridge) {
			return { linked: false, bridgeId: null, reachable: false };
		}

		return this.probe(loaded.bridge, loaded.appKey, !loaded.fromEnv);
	}

	async link(input: { bridgeId?: string } = {}): Promise<LinkResult> {
		const bridge = await this.resolveForLink(input.bridgeId);
		const existing = await this.options.store.load();

		if (!existing?.appKey) {
			await this.options.store.save({ bridge });
		}

		try {
			const { username } = await registerApplication({
				baseUrl: bridgeBaseUrl(bridge),
				applicationName: APPLICATION_NAME,
				deviceName: DEVICE_NAME,
				httpClient: this.httpClientFor(bridge)
			});

			await this.options.store.save({ bridge, appKey: username });

			return { linked: true, bridgeId: bridge.id };
		} catch (error) {
			if (error instanceof HueLinkButtonNotPressedError) {
				throw new SessionError(PRESS_BUTTON, 'link-button');
			}

			if (error instanceof HueNetworkError) {
				throw new SessionError(UNREACHABLE, 'unreachable');
			}

			throw this.publicError(error);
		}
	}

	async linkUntil(input: { bridgeId?: string } = {}): Promise<LinkResult> {
		const now = this.options.now ?? Date.now;
		const sleep = this.options.sleep ?? delay;
		const deadline = now() + (this.options.linkWindowMs ?? LINK_WINDOW_MS);

		for (;;) {
			try {
				return await this.link(input);
			} catch (error) {
				if (!(error instanceof SessionError) || error.code !== 'link-button' || now() >= deadline) {
					throw error;
				}

				await sleep(Math.min(LINK_RETRY_MS, Math.max(0, deadline - now())));
			}
		}
	}

	async getHome(): Promise<HomeSnapshot> {
		const { bridge, appKey } = await this.requireLinked();

		return this.call(bridge, appKey, async (client) => {
			const [lights, rooms, zones, groupedLights, scenes] = await Promise.all([
				client.lights.list(),
				client.rooms.list(),
				client.zones.list(),
				client.groupedLights.list(),
				client.scenes.list()
			]);

			return mapHome({
				lights: dataOf(lights, 'Listing lights'),
				rooms: dataOf(rooms, 'Listing rooms'),
				zones: dataOf(zones, 'Listing zones'),
				groupedLights: dataOf(groupedLights, 'Listing grouped lights'),
				scenes: dataOf(scenes, 'Listing scenes')
			});
		});
	}

	async setLight(change: TargetChange): Promise<TargetState> {
		const command = lightCommand(change);
		const { bridge, appKey } = await this.requireLinked();

		return this.call(bridge, appKey, async (client) => {
			const lights = dataOf(await client.lights.list(), 'Listing lights');
			const light = selectLight(lights, change);
			const updated = await client.lights.update(light.id, command);

			assertApplied(updated, 'Setting the light');

			const [fresh] = dataOf(await client.lights.get(light.id), 'Reading the light');

			if (!fresh) {
				throw new SessionError(`No light with id ${light.id}.`, 'not-found');
			}

			return targetFromLight(fresh);
		});
	}

	async setArea(change: TargetChange): Promise<TargetState> {
		const command = lightCommand(change);
		const { bridge, appKey } = await this.requireLinked();

		return this.call(bridge, appKey, async (client) => {
			const [rooms, zones] = await Promise.all([
				dataOf(await client.rooms.list(), 'Listing rooms'),
				dataOf(await client.zones.list(), 'Listing zones')
			]);
			const area = selectArea(rooms, zones, change);
			const serviceId = groupedServiceId(area.services);

			if (!serviceId) {
				throw new SessionError(`${area.metadata.name} has no grouped light.`, 'failed');
			}

			assertApplied(await client.groupedLights.update(serviceId, command), 'Setting the area');

			const [fresh] = dataOf(
				await client.groupedLights.get(serviceId),
				'Reading the grouped light'
			);

			return targetFromArea(area, fresh);
		});
	}

	async activateScene(change: Pick<TargetChange, 'name' | 'id'>): Promise<SceneActivation> {
		const { bridge, appKey } = await this.requireLinked();

		return this.call(bridge, appKey, async (client) => {
			const [scenes, rooms, zones] = await Promise.all([
				dataOf(await client.scenes.list(), 'Listing scenes'),
				dataOf(await client.rooms.list(), 'Listing rooms'),
				dataOf(await client.zones.list(), 'Listing zones')
			]);
			const groups = groupNames(rooms, zones);
			const scene = selectScene(scenes, change, groups);

			assertApplied(
				await client.scenes.update(scene.id, { recall: { action: 'active' } }),
				'Recalling the scene'
			);

			return {
				id: scene.id,
				name: scene.metadata.name,
				group: groups.get(scene.group.rid) ?? scene.group.rid
			};
		});
	}

	private async requireLinked(): Promise<{ bridge: BridgeAddress; appKey: string }> {
		const loaded = await this.load();

		if (!loaded.bridge || !loaded.appKey) {
			throw new SessionError(NOT_LINKED, 'not-linked');
		}

		return { bridge: loaded.bridge, appKey: loaded.appKey };
	}

	private async load(): Promise<LoadedBridge> {
		const loaded = await this.readConfig();

		return this.refreshAddress(loaded);
	}

	private async readConfig(): Promise<LoadedBridge> {
		let fromEnv: BridgeAddress | undefined;

		try {
			fromEnv = readBridgeEnv(this.options.env);
		} catch (error) {
			throw new SessionError(
				error instanceof Error ? error.message : 'Invalid bridge environment.',
				'invalid'
			);
		}

		const config = await this.options.store.load();

		if (fromEnv) {
			return {
				bridge: fromEnv,
				appKey: config && sameBridge(config.bridge, fromEnv) ? config.appKey : undefined,
				fromEnv: true
			};
		}

		if (!config) {
			return { fromEnv: false };
		}

		return { bridge: config.bridge, appKey: config.appKey, fromEnv: false };
	}

	private async refreshAddress(loaded: LoadedBridge): Promise<LoadedBridge> {
		const current = loaded.bridge;

		if (this.addressRefreshed || loaded.fromEnv || !current) {
			return loaded;
		}

		this.addressRefreshed = true;

		let discovered: DiscoveredBridge[];

		try {
			discovered = await this.options.discover();
		} catch {
			return loaded;
		}

		const match = discovered.map(toAddress).find((bridge) => sameBridge(bridge, current));

		if (!match || (match.ip === current.ip && match.port === current.port)) {
			return loaded;
		}

		await this.options.store.save({
			bridge: match,
			...(loaded.appKey === undefined ? {} : { appKey: loaded.appKey })
		});

		return { bridge: match, appKey: loaded.appKey, fromEnv: false };
	}

	private async resolveForLink(bridgeId: string | undefined): Promise<BridgeAddress> {
		const requested = bridgeId?.trim();
		const loaded = await this.load();
		const known = loaded.bridge;

		if (requested && known && !sameText(known.id, requested) && loaded.fromEnv) {
			throw new SessionError(`HUE_BRIDGE_ID is ${known.id}.`, 'invalid');
		}

		if (known && (!requested || sameText(known.id, requested))) {
			return known;
		}

		let discovered: DiscoveredBridge[];

		try {
			discovered = await this.options.discover();
		} catch (error) {
			throw new SessionError(
				`Bridge discovery failed (${error instanceof Error ? error.message : String(error)}). Set HUE_BRIDGE_IP and HUE_BRIDGE_ID.`,
				'unreachable'
			);
		}

		const addresses = discovered.map(toAddress);

		if (requested) {
			const match = addresses.find((bridge) => sameText(bridge.id, requested));

			if (!match) {
				throw new SessionError(`No bridge with id ${requested}.`, 'not-found');
			}

			return match;
		}

		const [only] = addresses;

		if (addresses.length === 1 && only) {
			return only;
		}

		if (addresses.length === 0) {
			throw new SessionError(
				'No Hue bridge found on this network. Set HUE_BRIDGE_IP and HUE_BRIDGE_ID.',
				'not-found'
			);
		}

		const list = addresses.map((bridge) => `${bridge.id} (${bridge.ip})`).join(', ');

		throw new SessionError(`Several bridges found: ${list}. Pass bridgeId.`, 'ambiguous');
	}

	private open(bridge: BridgeAddress, appKey: string) {
		return createHueClient({
			baseUrl: bridgeBaseUrl(bridge),
			appKey,
			httpClient: this.httpClientFor(bridge),
			throttle: false
		});
	}

	private httpClientFor(bridge: BridgeAddress): HttpClient {
		return this.options.httpClient ?? createBridgeHttpClient({ bridgeId: bridge.id });
	}

	private async probe(
		bridge: BridgeAddress,
		appKey: string | undefined,
		allowMove: boolean
	): Promise<BridgeStatus> {
		try {
			await this.open(bridge, appKey ?? 'unlinked').bridges.list();

			return { linked: Boolean(appKey), bridgeId: bridge.id, reachable: true };
		} catch (error) {
			if (error instanceof HueUnauthorizedError || error instanceof HueForbiddenError) {
				if (appKey) {
					await this.forgetRejectedKey(bridge, appKey);
				}

				return { linked: false, bridgeId: bridge.id, reachable: true };
			}

			if (isUnreachable(error)) {
				if (allowMove) {
					const moved = await this.movedBridge(bridge);

					if (moved) {
						return this.probe(moved, appKey, false);
					}
				}

				return { linked: Boolean(appKey), bridgeId: bridge.id, reachable: false };
			}

			throw this.publicError(error);
		}
	}

	private async call<T>(
		bridge: BridgeAddress,
		appKey: string,
		fn: (client: ReturnType<typeof createHueClient>) => Promise<T>,
		allowMove = true
	): Promise<T> {
		try {
			return await fn(this.open(bridge, appKey));
		} catch (error) {
			if (error instanceof SessionError) {
				throw error;
			}

			if (error instanceof HueUnauthorizedError || error instanceof HueForbiddenError) {
				await this.forgetRejectedKey(bridge, appKey);
				throw new SessionError(KEY_REJECTED, 'unauthorized');
			}

			if (allowMove && isUnreachable(error)) {
				const moved = await this.movedBridge(bridge);

				if (moved) {
					return this.call(moved, appKey, fn, false);
				}
			}

			throw this.publicError(error);
		}
	}

	private async forgetRejectedKey(bridge: BridgeAddress, rejectedKey: string): Promise<void> {
		await this.options.store.modify((config) => {
			if (!config?.appKey || config.appKey !== rejectedKey || !sameBridge(config.bridge, bridge)) {
				return undefined;
			}

			return { bridge: config.bridge };
		});
	}

	private async movedBridge(current: BridgeAddress): Promise<BridgeAddress | undefined> {
		this.addressRefreshed = false;
		const loaded = await this.readConfig();

		if (loaded.fromEnv || !loaded.bridge || !sameBridge(loaded.bridge, current)) {
			return undefined;
		}

		const refreshed = await this.refreshAddress(loaded);

		if (!refreshed.bridge || sameEndpoint(refreshed.bridge, current)) {
			return undefined;
		}

		return refreshed.bridge;
	}

	private publicError(error: unknown): Error {
		if (error instanceof SessionError) {
			return error;
		}

		if (error instanceof HueNetworkError || isTransportTimeout(error)) {
			return new SessionError(UNREACHABLE, 'unreachable');
		}

		if (error instanceof HueError) {
			return new SessionError(error.message, 'failed');
		}

		return error instanceof Error
			? error
			: new SessionError('The Hue bridge request failed.', 'failed');
	}
}

export function createDefaultSession(
	env: Record<string, string | undefined> = process.env
): HueSession {
	return new HueSession({
		env,
		store: new ConfigStore(defaultConfigPath(env)),
		discover: () => discoverWithTimeout()
	});
}

function dataOf<T>(response: ApiResponse<T>, label: string): T[] {
	if (response.errors.length > 0) {
		const detail = response.errors.map((error) => error.description).join('; ');

		throw new SessionError(`${label} failed: ${detail}`, 'failed');
	}

	return response.data;
}

function assertApplied(response: ApiResponse<unknown>, label: string): void {
	dataOf(response, label);
}

function toAddress(bridge: DiscoveredBridge): BridgeAddress {
	const address: BridgeAddress = { id: bridge.id.toLowerCase(), ip: bridge.internalipaddress };

	if (bridge.port !== undefined) {
		address.port = bridge.port;
	}

	return address;
}

function sameText(left: string, right: string): boolean {
	return left.toLowerCase() === right.toLowerCase();
}

function sameEndpoint(left: BridgeAddress, right: BridgeAddress): boolean {
	return left.ip === right.ip && left.port === right.port;
}

function isUnreachable(error: unknown): boolean {
	return error instanceof HueNetworkError || isTransportTimeout(error);
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function discoverWithTimeout(): ReturnType<typeof discoverBridges> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 10_000);

	return discoverBridges({ signal: controller.signal }).finally(() => clearTimeout(timer));
}

function isTransportTimeout(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'name' in error &&
		(error.name === 'AbortError' || error.name === 'TimeoutError')
	);
}
