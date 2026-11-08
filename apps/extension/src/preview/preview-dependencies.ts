import { createHueApp, hexToXy, type BridgeLight } from '@huxel/app';
import { HueLinkButtonNotPressedError, HueNetworkError } from '@huxel/client';
import { MemoryHostAccess } from '../adapters/memory-host-access';
import { MemoryStorage } from '../adapters/memory-storage';
import type { Dependencies } from '../ports';
import { SimulatedGateway } from './simulated-gateway';

export const PREVIEW_BRIDGE = {
	id: '001788fffe000001',
	internalipaddress: '192.168.1.2'
};

export const PREVIEW_LIGHTS: readonly BridgeLight[] = [
	{
		id: 'desk',
		name: 'Desk',
		isOn: true,
		brightness: 80,
		color: hexToXy('#ffbf00'),
		temperature: null
	},
	{
		id: 'sofa',
		name: 'Sofa',
		isOn: false,
		brightness: 45,
		color: hexToXy('#2f6bff'),
		temperature: null
	},
	{
		id: 'hall',
		name: 'Hallway',
		isOn: true,
		brightness: 30,
		color: null,
		temperature: { mirek: 370 }
	},
	{ id: 'kitchen', name: 'Kitchen', isOn: false, brightness: null, color: null, temperature: null },
	{
		id: 'bed',
		name: 'Bedside',
		isOn: true,
		brightness: 15,
		color: hexToXy('#ff8a1f'),
		temperature: null
	}
];

const LATENCY_MS = 400;

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createPreviewDependencies(): Dependencies {
	const gateway = new SimulatedGateway(PREVIEW_LIGHTS, { latencyMs: 150 });
	const previewOrigin = `https://${PREVIEW_BRIDGE.internalipaddress}`;
	let registrationAttempts = 0;

	return {
		storage: new MemoryStorage(),
		hostAccess: new MemoryHostAccess(),
		async discoverBridges() {
			await wait(LATENCY_MS);

			return [PREVIEW_BRIDGE];
		},
		async registerApplication(origin) {
			await wait(LATENCY_MS);

			if (origin !== previewOrigin) {
				throw new HueNetworkError(`Network request failed: POST ${origin}/api`);
			}

			registrationAttempts += 1;

			if (registrationAttempts === 1) {
				throw new HueLinkButtonNotPressedError(
					'Hue bridge link button has not been pressed (V1 error 101)',
					{ type: 101, address: '', description: 'link button not pressed' }
				);
			}

			return 'preview-app-key';
		},
		openHueApp: () => createHueApp({ gateway })
	};
}
