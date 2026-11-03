import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, test } from 'bun:test';
import { SessionError } from '../src/errors';
import type { HueControl } from '../src/server';
import { createHueMcpServer } from '../src/server';

describe('hue mcp server', () => {
	const errors: unknown[][] = [];
	const original = console.error;

	afterEach(() => {
		console.error = original;
		errors.length = 0;
	});

	test('lists the hue tools and returns tool results', async () => {
		console.error = (...args: unknown[]) => {
			errors.push(args);
		};
		const control = fakeControl();
		const client = new Client({ name: 'test', version: '0.0.0' });
		const server = createHueMcpServer(control);
		const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

		await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

		const listed = await client.listTools();
		const names = listed.tools.map((tool) => tool.name).sort();

		expect(names).toEqual([
			'activate_scene',
			'bridge_status',
			'get_home',
			'link_bridge',
			'set_area',
			'set_light'
		]);

		const status = await client.callTool({ name: 'bridge_status', arguments: {} });

		expect(status.isError).toBeUndefined();
		expect(text(status)).toBe(JSON.stringify({ linked: false, bridgeId: null, reachable: false }));

		const missing = await client.callTool({
			name: 'set_light',
			arguments: { name: 'Nope', on: true }
		});

		expect(missing.isError).toBe(true);
		expect(text(missing)).toBe('No light named "Nope".');
		expect(errors).toHaveLength(0);

		const broken = await client.callTool({
			name: 'set_area',
			arguments: { name: 'Office', on: true }
		});

		expect(broken.isError).toBe(true);
		expect(text(broken)).toBe('The Hue bridge request failed.');
		expect(text(broken)).not.toContain('boom');
		expect(errors).toHaveLength(1);

		await client.close();
		await server.close();
	});
});

function fakeControl(): HueControl {
	return {
		async status() {
			return { linked: false, bridgeId: null, reachable: false };
		},
		async link() {
			return { linked: true, bridgeId: 'bridge-1' };
		},
		async getHome() {
			return { rooms: [], zones: [], lights: [], scenes: [] };
		},
		async setLight() {
			throw new SessionError('No light named "Nope".', 'not-found');
		},
		async setArea() {
			throw new Error('boom');
		},
		async activateScene() {
			return { id: 'scene-1', name: 'Concentrate', group: 'Office' };
		}
	};
}

function text(result: unknown): string {
	if (typeof result !== 'object' || result === null || !('content' in result)) {
		throw new Error('Tool result has no content');
	}

	const content = result.content;

	if (!Array.isArray(content) || content.length === 0) {
		throw new Error('Tool result has no content');
	}

	const [first] = content;

	if (
		typeof first !== 'object' ||
		first === null ||
		!('text' in first) ||
		typeof first.text !== 'string'
	) {
		throw new Error('Tool result is not text');
	}

	return first.text;
}
