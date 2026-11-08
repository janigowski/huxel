import { data, UnknownDataError, type Data } from 'data-bus';

export interface HueBridge {
	id: string;
	proxyPath: string;
}

declare module 'data-bus' {
	interface DataMap {
		'hue.bridge': HueBridge;
	}
}

const initialBridge: HueBridge = {
	id: '001788fffe7d45eb',
	proxyPath: '/bridge'
};

function bridgeSlot(): Data<HueBridge> {
	try {
		return data('hue.bridge');
	} catch (error) {
		if (error instanceof UnknownDataError) {
			return data('hue.bridge', initialBridge);
		}

		throw error;
	}
}

export const bridge = bridgeSlot();

export function bridgeBaseUrl(): string {
	return `${location.origin}${bridge.value.proxyPath}`;
}
