import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SessionError } from './errors';
import type { HomeSnapshot, SceneActivation, TargetChange, TargetState } from './home';
import type { BridgeStatus, LinkResult } from './session';

export interface HueControl {
	status(): Promise<BridgeStatus>;
	link(input?: { bridgeId?: string }): Promise<LinkResult>;
	getHome(): Promise<HomeSnapshot>;
	setLight(change: TargetChange): Promise<TargetState>;
	setArea(change: TargetChange): Promise<TargetState>;
	activateScene(change: Pick<TargetChange, 'name' | 'id'>): Promise<SceneActivation>;
}

function targetSchema(noun: string) {
	return {
		name: z.string().optional().describe(`${noun} name.`),
		id: z.string().optional().describe(`${noun} id. Use this when several share a name.`),
		on: z.boolean().optional().describe('Turn it on or off.'),
		brightness: z.number().optional().describe('Brightness from 0 to 100. Also turns it on.'),
		color: z.string().optional().describe('Color as #rrggbb. Also turns it on.')
	};
}

export function createHueMcpServer(control: HueControl): McpServer {
	const server = new McpServer({ name: 'huxel-mcp', version: '0.1.0' });

	server.registerTool(
		'bridge_status',
		{
			description:
				'Report whether this machine has a Hue application key and whether the bridge answers.',
			annotations: { readOnlyHint: true }
		},
		async () => run(() => control.status())
	);

	server.registerTool(
		'link_bridge',
		{
			description:
				'Link this machine to a Hue bridge on the local network. Ask the user to press the link button on the bridge, then call this once. If the button was not pressed, ask them to press it and call again within 30 seconds. Pass bridgeId when several bridges are found. The result never includes the application key.',
			inputSchema: {
				bridgeId: z
					.string()
					.optional()
					.describe('Bridge id from a previous "several bridges" result.')
			}
		},
		async ({ bridgeId }) => run(() => control.link(bridgeId === undefined ? {} : { bridgeId }))
	);

	server.registerTool(
		'get_home',
		{
			description:
				'List rooms, zones, lights, and scenes. Each entry has an id and name. Lights and areas include on, brightness from 0 to 100, and color as #rrggbb when the device supports color.',
			annotations: { readOnlyHint: true }
		},
		async () => run(() => control.getHome())
	);

	server.registerTool(
		'set_light',
		{
			description:
				'Change one light by name or id. Setting brightness or color also turns the light on. on false turns the light off and ignores brightness and color. If several lights share a name, the error lists their ids.',
			inputSchema: targetSchema('Light')
		},
		async (change) => run(() => control.setLight(change))
	);

	server.registerTool(
		'set_area',
		{
			description:
				'Change a room or zone by name or id through its grouped light. Fields match set_light. If a room and a zone share a name, the error lists their ids.',
			inputSchema: targetSchema('Room or zone')
		},
		async (change) => run(() => control.setArea(change))
	);

	server.registerTool(
		'activate_scene',
		{
			description:
				'Recall a scene by name or id. If several scenes share a name, the error lists their ids and groups. Pass id to choose one.',
			inputSchema: {
				name: z.string().optional().describe('Scene name.'),
				id: z.string().optional().describe('Scene id. Use this when several scenes share a name.')
			}
		},
		async ({ name, id }) => run(() => control.activateScene({ name, id }))
	);

	return server;
}

function run(action: () => Promise<unknown>): Promise<CallToolResult> {
	return action().then(
		(value) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] }),
		(error: unknown) => {
			if (error instanceof SessionError) {
				return { isError: true, content: [{ type: 'text', text: error.message }] };
			}

			console.error(error);

			return { isError: true, content: [{ type: 'text', text: 'The Hue bridge request failed.' }] };
		}
	);
}
