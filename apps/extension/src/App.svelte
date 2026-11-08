<script lang="ts">
	import { ConnectPanel, DashboardBar, Hero, LightsSection, Notice } from '@huxel/design-system';
	import { createSvelteHueApp } from '@huxel/app/svelte';
	import { untrack } from 'svelte';
	import { bridgeOrigin, parseBridgeHost } from './bridge/bridge-host';
	import { isUnreachable, unreachableMessage } from './bridge/session-error';
	import AccessPanel from './components/AccessPanel.svelte';
	import BridgeHostField from './components/BridgeHostField.svelte';
	import CertificateHint from './components/CertificateHint.svelte';
	import LinkedBridgeBar from './components/LinkedBridgeBar.svelte';
	import SelectedHost from './components/SelectedHost.svelte';
	import type { BridgeSession } from './session/bridge-session.svelte';

	interface Props {
		session: BridgeSession;
	}

	let { session }: Props = $props();

	const hue = $derived(session.app ? createSvelteHueApp(session.app) : null);
	const unreachable = $derived(hue?.status === 'error' && isUnreachable(hue.error));
	const errorMessage = $derived(session.error?.message ?? null);

	$effect(() => {
		const app = hue;

		if (!app) {
			return;
		}

		untrack(() => {
			app.initialize().catch(() => {});
		});
	});
</script>

<main class="page">
	<DashboardBar label="Hue control dashboard" date={new Date()} connection={hue?.connection} />
	<Hero title="Home Lights" subtitle={session.subtitle} />

	{#if session.status === 'restoring'}
		<Notice tone="muted">Loading…</Notice>
	{:else if session.status === 'linked' && session.bridge}
		{@const host = session.bridge.host}

		{#if !hue}
			<AccessPanel
				{host}
				requesting={session.reconnecting}
				error={errorMessage}
				onallow={() => session.reconnect()}
			>
				<p>Site access to {host} was removed. Allow it again to control your lights.</p>
			</AccessPanel>
		{:else if unreachable}
			<Notice>{unreachableMessage(host)}</Notice>
			<CertificateHint url="{bridgeOrigin(host)}/" onretry={() => session.reconnect()} />
		{:else}
			<LightsSection {hue} />
		{/if}

		{#if hue && errorMessage}
			<Notice>{errorMessage}</Notice>
		{/if}

		<LinkedBridgeBar {host} onforget={() => session.forget()} />
	{:else if session.linkHost}
		<ConnectPanel
			connecting={session.connecting}
			error={errorMessage}
			onconnect={() => session.connect()}
			disabled={session.busy}
		>
			<SelectedHost
				host={session.linkHost}
				disabled={session.busy}
				onchange={() => session.changeHost()}
			/>
		</ConnectPanel>

		{#if session.error?.certificateUrl}
			<CertificateHint url={session.error.certificateUrl} />
		{/if}
	{:else}
		<AccessPanel
			host={parseBridgeHost(session.hostInput)}
			requesting={session.requestingAccess}
			error={errorMessage}
			onallow={() => session.allowAccess()}
			disabled={session.busy}
		>
			<p>
				Find your bridge or enter its address, then allow the extension to reach it on your local
				network.
			</p>
			<BridgeHostField
				bind:value={session.hostInput}
				discovering={session.discovering}
				disabled={session.busy}
				ondiscover={() => session.discover()}
				onsubmit={() => session.allowAccess()}
			/>
		</AccessPanel>
	{/if}
</main>

<style>
	.page {
		max-width: var(--page-width);
		margin-inline: auto;
		padding: var(--space-4) var(--page-gutter) var(--space-6);
	}
</style>
