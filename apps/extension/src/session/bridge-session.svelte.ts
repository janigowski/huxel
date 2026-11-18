import { describeError, type HueApp } from '@huxel/app';
import { HueNetworkError, type DiscoveredBridge } from '@huxel/client';
import { SvelteMap } from 'svelte/reactivity';
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
export type StepStatus = 'in-progress' | 'done' | 'needs-you';

type AddressStatus = 'discovering' | 'needed' | 'ready';
type TrustPhase = 'closed' | 'open' | 'done';

const NO_BRIDGE = 'No bridge found on this network. Enter its address instead.';
const SEVERAL_BRIDGES = 'More than one bridge was found. Enter the address of the one you want.';
const DISCOVERY_HINT = 'The address came from discovery.';

export class BridgeSession {
	status = $state<SessionStatus>('restoring');
	hostInput = $state('');
	linkHost = $state<string | null>(null);
	discovering = $state(false);
	requestingAccess = $state(false);
	connecting = $state(false);
	reconnecting = $state(false);
	reaching = $state(false);
	error = $state.raw<SessionError | null>(null);
	bridge = $state.raw<LinkedBridge | null>(null);
	app = $state.raw<HueApp | null>(null);
	addressStatus = $state<AddressStatus>('needed');
	addressMessage = $state<string | null>(null);
	addressHint = $state<string | null>(null);
	candidateHosts = $state<string[]>([]);
	editingAddress = $state(false);
	trustPhase = $state<TrustPhase>('closed');

	readonly busy = $derived(
		this.discovering ||
			this.requestingAccess ||
			this.connecting ||
			this.reconnecting ||
			this.reaching
	);

	readonly subtitle = $derived(
		this.bridge ? `Bridge ${this.bridge.id ?? this.bridge.host}` : 'No bridge linked'
	);

	readonly showAddressField = $derived(this.addressStatus === 'needed' || this.editingAddress);

	readonly addressStepStatus = $derived<StepStatus>(
		this.addressStatus === 'discovering'
			? 'in-progress'
			: this.addressStatus === 'ready' && !this.editingAddress
				? 'done'
				: 'needs-you'
	);

	readonly trustVisible = $derived(
		this.addressStatus === 'ready' && !this.editingAddress && this.trustPhase !== 'closed'
	);

	readonly trustStepStatus = $derived<StepStatus>(
		this.reaching ? 'in-progress' : this.trustPhase === 'done' ? 'done' : 'needs-you'
	);

	readonly accessVisible = $derived(this.showAddressField || this.trustVisible);

	readonly accessStepStatus = $derived<StepStatus>(
		this.requestingAccess ? 'in-progress' : this.linkHost ? 'done' : 'needs-you'
	);

	readonly authorizeVisible = $derived(this.trustPhase === 'done' && this.linkHost !== null);

	readonly authorizeStepStatus = $derived<StepStatus>(
		this.connecting ? 'in-progress' : 'needs-you'
	);

	private readonly dependencies: Dependencies;
	private readonly store: BridgeStore;
	private readonly discoveredByHost = new SvelteMap<string, string>();

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

			if (draftHost) {
				await this.useSavedHost(draftHost);
				return;
			}

			this.hostInput = '';
			this.addressStatus = 'discovering';
			this.status = 'unlinked';
			void this.discover();
		} catch (error) {
			this.error = { message: describeError(error) };
			this.addressStatus = 'needed';
			this.status = 'unlinked';
		}
	}

	async discover(): Promise<void> {
		if (this.busy) {
			return;
		}

		const typedInput = this.hostInput;

		this.discovering = true;
		this.addressStatus = 'discovering';
		this.addressMessage = null;
		this.error = null;

		try {
			const bridges = await this.dependencies.discoverBridges();

			if (this.hostInput !== typedInput) {
				this.addressStatus = 'needed';
				return;
			}

			const hosts = this.rememberBridges(bridges);
			const only = hosts.length === 1 ? hosts[0] : undefined;

			if (only) {
				await this.useDiscoveredHost(only);
				return;
			}

			this.candidateHosts = hosts;
			this.addressStatus = 'needed';
			this.addressHint = null;
			this.addressMessage = hosts.length === 0 ? NO_BRIDGE : SEVERAL_BRIDGES;
		} catch (error) {
			if (this.hostInput !== typedInput) {
				this.addressStatus = 'needed';
				return;
			}

			this.addressStatus = 'needed';
			this.addressHint = null;
			this.candidateHosts = [];
			this.addressMessage = describeDiscoveryError(error).message;
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
		const manual = this.editingAddress || this.addressStatus === 'needed';

		this.hostInput = host;

		if (manual) {
			this.addressHint = null;
		}

		this.addressStatus = 'ready';
		this.editingAddress = false;
		this.addressMessage = null;
		this.trustPhase = 'open';
		this.requestingAccess = true;

		try {
			const request = this.dependencies.hostAccess.request(bridgeOrigin(host));
			const [granted] = await Promise.all([request, this.store.saveDraftHost(host)]);

			if (!granted) {
				this.linkHost = null;
				this.error = { message: accessDeniedMessage(host) };
				return;
			}

			this.linkHost = host;
		} catch (error) {
			this.linkHost = null;
			this.error = { message: describeError(error) };
			return;
		} finally {
			this.requestingAccess = false;
		}

		await this.reach();
	}

	changeHost(): void {
		if (this.busy) {
			return;
		}

		this.error = null;
		this.editingAddress = true;
		this.linkHost = null;
		this.trustPhase = 'closed';
		this.addressHint = null;
	}

	async connect(): Promise<void> {
		const host = this.linkHost;

		if (this.busy || !host || this.trustPhase !== 'done') {
			return;
		}

		const origin = bridgeOrigin(host);

		this.connecting = true;
		this.error = null;

		try {
			if (!(await this.hasAccess(host))) {
				this.linkHost = null;
				this.trustPhase = 'open';
				this.error = { message: accessDeniedMessage(host) };
				return;
			}

			const appKey = await this.dependencies.registerApplication(origin);
			const id = this.discoveredByHost.get(host);
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
		this.addressStatus = 'ready';
		this.addressHint = null;
		this.addressMessage = null;
		this.candidateHosts = [];
		this.editingAddress = false;
		this.trustPhase = 'open';
		this.status = 'unlinked';

		if (this.linkHost) {
			await this.reach();
		}
	}

	private async useSavedHost(host: string): Promise<void> {
		this.hostInput = host;
		this.addressStatus = 'ready';
		this.addressHint = null;
		this.trustPhase = 'open';
		this.linkHost = (await this.hasAccess(host)) ? host : null;
		this.status = 'unlinked';

		if (this.linkHost) {
			await this.reach();
		}
	}

	private async useDiscoveredHost(host: string): Promise<void> {
		this.hostInput = host;
		this.candidateHosts = [];
		this.addressMessage = null;
		this.addressHint = DISCOVERY_HINT;
		this.addressStatus = 'ready';
		this.editingAddress = false;
		this.trustPhase = 'open';
		this.linkHost = (await this.hasAccess(host)) ? host : null;

		if (this.linkHost) {
			await this.reach();
		}
	}

	private async reach(): Promise<void> {
		const host = this.linkHost;

		if (!host || this.trustPhase === 'done' || this.reaching) {
			return;
		}

		this.reaching = true;

		try {
			await this.dependencies.reachBridge(bridgeOrigin(host));

			if (this.linkHost !== host) {
				return;
			}

			this.trustPhase = 'done';
		} catch (error) {
			if (this.linkHost !== host) {
				return;
			}

			this.trustPhase = 'open';

			if (!(error instanceof HueNetworkError)) {
				this.error = { message: describeError(error) };
			}
		} finally {
			this.reaching = false;
		}
	}

	private rememberBridges(bridges: DiscoveredBridge[]): string[] {
		this.discoveredByHost.clear();

		const hosts: string[] = [];

		for (const bridge of bridges) {
			const host = formatDiscoveredHost(bridge.internalipaddress, bridge.port);

			if (!host) {
				continue;
			}

			hosts.push(host);
			this.discoveredByHost.set(host, bridge.id.toLowerCase());
		}

		return hosts;
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
