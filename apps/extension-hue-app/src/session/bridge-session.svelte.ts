import { describeError, type HueApp } from '@huxel/app';
import { bridgeOrigin, formatDiscoveredHost, parseBridgeHostInput } from '../bridge/bridge-host';
import { createBridgeStore, type BridgeStore, type LinkedBridge } from '../bridge/bridge-store';
import {
	accessDeniedMessage,
	describeConnectError,
	describeDiscoveryError,
	describeInvalidHost,
	type SessionError
} from '../bridge/session-error';
import type { Dependencies } from '../ports';

export type SessionStatus = 'restoring' | 'unlinked' | 'linked';

interface DiscoveredHost {
	host: string;
	id: string;
}

export class BridgeSession {
	status = $state<SessionStatus>('restoring');
	hostInput = $state('');
	linkHost = $state<string | null>(null);
	discovering = $state(false);
	requestingAccess = $state(false);
	connecting = $state(false);
	reconnecting = $state(false);
	error = $state.raw<SessionError | null>(null);
	bridge = $state.raw<LinkedBridge | null>(null);
	app = $state.raw<HueApp | null>(null);

	readonly busy = $derived(
		this.discovering || this.requestingAccess || this.connecting || this.reconnecting
	);

	readonly subtitle = $derived(
		this.bridge ? `Bridge ${this.bridge.id ?? this.bridge.host}` : 'No bridge linked'
	);

	private readonly dependencies: Dependencies;
	private readonly store: BridgeStore;
	private discovered: DiscoveredHost | null = null;

	constructor(dependencies: Dependencies) {
		this.dependencies = dependencies;
		this.store = createBridgeStore(dependencies.storage);
	}

	async restore(): Promise<void> {
		try {
			const [bridge, draftHost] = await Promise.all([
				this.store.loadLinkedBridge(),
				this.store.loadDraftHost()
			]);

			if (bridge) {
				await this.restoreLinked(bridge);
				return;
			}

			this.hostInput = draftHost ?? '';
			this.linkHost = draftHost && (await this.hasAccess(draftHost)) ? draftHost : null;
		} catch (error) {
			this.error = { message: describeError(error) };
		}

		this.status = 'unlinked';
	}

	async discover(): Promise<void> {
		if (this.busy) {
			return;
		}

		const typedInput = this.hostInput;

		this.discovering = true;
		this.error = null;

		try {
			const [first] = await this.dependencies.discoverBridges();
			const host = first ? formatDiscoveredHost(first.internalipaddress, first.port) : null;

			if (!first || !host) {
				this.error = { message: 'No bridge found on this network. Enter its address instead.' };
				return;
			}

			if (this.hostInput !== typedInput) {
				return;
			}

			this.discovered = { host, id: first.id.toLowerCase() };
			this.hostInput = host;
			this.linkHost = (await this.hasAccess(host)) ? host : null;
		} catch (error) {
			this.error = describeDiscoveryError(error);
		} finally {
			this.discovering = false;
		}
	}

	async allowAccess(): Promise<void> {
		if (this.busy) {
			return;
		}

		this.error = null;

		const parsed = parseBridgeHostInput(this.hostInput);

		if (!parsed.ok) {
			this.error = describeInvalidHost(parsed.reason);
			return;
		}

		const { host } = parsed;

		this.requestingAccess = true;

		try {
			const request = this.dependencies.hostAccess.request(bridgeOrigin(host));
			const [granted] = await Promise.all([request, this.store.saveDraftHost(host)]);

			this.hostInput = host;

			if (!granted) {
				this.error = { message: accessDeniedMessage(host) };
				return;
			}

			this.linkHost = host;
		} catch (error) {
			this.error = { message: describeError(error) };
		} finally {
			this.requestingAccess = false;
		}
	}

	changeHost(): void {
		if (this.busy) {
			return;
		}

		this.error = null;
		this.linkHost = null;
	}

	async connect(): Promise<void> {
		const host = this.linkHost;

		if (this.busy || !host) {
			return;
		}

		const origin = bridgeOrigin(host);

		this.connecting = true;
		this.error = null;

		try {
			if (!(await this.hasAccess(host))) {
				this.linkHost = null;
				this.error = { message: accessDeniedMessage(host) };
				return;
			}

			const appKey = await this.dependencies.registerApplication(origin);
			const id = this.discovered?.host === host ? this.discovered.id : undefined;
			const bridge: LinkedBridge = id === undefined ? { host, appKey } : { host, id, appKey };

			await this.store.saveLinkedBridge(bridge);
			this.open(bridge);
		} catch (error) {
			this.error = describeConnectError(error, origin);
		} finally {
			this.connecting = false;
		}
	}

	async reconnect(): Promise<void> {
		const bridge = this.bridge;

		if (this.busy || !bridge) {
			return;
		}

		this.reconnecting = true;
		this.error = null;

		try {
			const granted = await this.dependencies.hostAccess.request(bridgeOrigin(bridge.host));

			if (!granted) {
				this.error = { message: accessDeniedMessage(bridge.host) };
				return;
			}

			this.open(bridge);
		} catch (error) {
			this.error = { message: describeError(error) };
		} finally {
			this.reconnecting = false;
		}
	}

	async forget(): Promise<void> {
		const bridge = this.bridge;

		if (this.busy || !bridge) {
			return;
		}

		this.error = null;

		try {
			await this.store.forgetLinkedBridge();
		} catch (error) {
			this.error = { message: describeError(error) };
			return;
		}

		this.linkHost = this.app ? bridge.host : null;
		this.replaceApp(null);
		this.bridge = null;
		this.hostInput = bridge.host;
		this.status = 'unlinked';
	}

	private async restoreLinked(bridge: LinkedBridge): Promise<void> {
		const granted = await this.hasAccess(bridge.host);

		if (granted) {
			this.open(bridge);
			return;
		}

		this.bridge = bridge;
		this.status = 'linked';
	}

	private hasAccess(host: string): Promise<boolean> {
		return this.dependencies.hostAccess.contains(bridgeOrigin(host));
	}

	private open(bridge: LinkedBridge): void {
		this.bridge = bridge;
		this.replaceApp(
			this.dependencies.openHueApp({ origin: bridgeOrigin(bridge.host), appKey: bridge.appKey })
		);
		this.status = 'linked';
	}

	private replaceApp(app: HueApp | null): void {
		this.app?.dispose();
		this.app = app;
	}
}
