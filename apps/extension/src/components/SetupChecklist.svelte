<script lang="ts">
	import { ActionButton, Label, Notice } from '@huxel/design-system';
	import { parseBridgeHost } from '../bridge/bridge-host';
	import type { BridgeSession, StepStatus } from '../session/bridge-session.svelte';
	import BridgeHostField from './BridgeHostField.svelte';
	import CertificateHint from './CertificateHint.svelte';
	import SelectedHost from './SelectedHost.svelte';

	interface Props {
		session: BridgeSession;
	}

	let { session }: Props = $props();

	const host = $derived(parseBridgeHost(session.hostInput));
	const certificateUrl = $derived(session.error?.certificateUrl ?? null);

	function statusLabel(status: StepStatus): string {
		if (status === 'in-progress') {
			return 'In progress';
		}

		if (status === 'done') {
			return 'Done';
		}

		return 'Needs you';
	}
</script>

{#snippet step(title: string, status: StepStatus)}
	<div class="heading">
		<span class="title">{title}</span>
		{#key status}
			<span class="status">{statusLabel(status)}</span>
		{/key}
	</div>
{/snippet}

<section class="setup">
	<p>The address is saved in this browser.</p>

	<ol aria-label="Bridge setup">
		<li>
			{@render step('Obtaining the bridge address', session.addressStepStatus)}

			{#if session.addressHint}
				<p>{session.addressHint}</p>
			{/if}

			{#if session.addressMessage}
				<p>{session.addressMessage}</p>
			{/if}

			{#if session.showAddressField && session.candidateHosts.length > 1}
				<ul aria-label="Discovered bridges">
					{#each session.candidateHosts as candidate (candidate)}
						<li>{candidate}</li>
					{/each}
				</ul>
			{/if}

			{#if session.showAddressField}
				<BridgeHostField
					bind:value={session.hostInput}
					disabled={session.busy}
					onsubmit={() => session.commitAddress()}
				/>
				<ActionButton onclick={() => session.commitAddress()} disabled={session.busy}>
					Use this address
				</ActionButton>
			{:else if session.addressStatus === 'ready' && host}
				<SelectedHost {host} disabled={session.busy} onchange={() => session.changeHost()} />
			{/if}
		</li>

		{#if session.trustVisible && host}
			<li>
				{@render step('Trust the bridge', session.trustStepStatus)}
				<p>
					Chrome says the connection is not private because it does not trust the bridge's
					certificate. Open the bridge, choose Advanced, then Proceed, close the tab, and come back.
				</p>
				<a href="{`https://${host}`}/" target="_blank" rel="noreferrer"
					><Label>Open {host}</Label></a
				>
			</li>
		{/if}

		{#if session.accessVisible}
			<li>
				{@render step('Allow access', session.accessStepStatus)}

				{#if session.accessStepStatus !== 'done'}
					<ActionButton onclick={() => session.allowAccess()} disabled={session.busy}>
						{session.requestingAccess
							? 'Waiting for access…'
							: host
								? `Allow access to ${host}`
								: 'Allow access'}
					</ActionButton>
				{/if}
			</li>
		{/if}

		{#if session.authorizeVisible}
			<li>
				{@render step('Authorizing the bridge', session.authorizeStepStatus)}
				<p>Press the link button on your Hue bridge, then connect within 30 seconds.</p>
				<p>The application key from the bridge is saved in this browser.</p>
				<ActionButton
					onclick={() => session.connect()}
					disabled={session.connecting || session.busy}
				>
					{session.connecting ? 'Connecting…' : 'Connect bridge'}
				</ActionButton>
			</li>
		{/if}
	</ol>

	{#if session.error && !certificateUrl}
		<Notice>{session.error.message}</Notice>
	{/if}

	{#if certificateUrl}
		<CertificateHint url={certificateUrl} />
	{/if}
</section>

<style>
	.setup {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-12);
		background: var(--background-neutral-medium);
		box-shadow: var(--elevation-1);
	}

	.setup :global(p) {
		margin: 0;
		color: var(--foreground-neutral-secondary);
	}

	ol {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li,
	.heading {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-2);
	}

	.heading {
		flex-direction: row;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.title {
		color: var(--foreground-neutral-primary);
		font-weight: var(--font-weight-control);
	}

	.status {
		color: var(--foreground-neutral-secondary);
		font-family: var(--font-mono);
		font-size: var(--font-size-body-2);
		animation: status-arrive 240ms ease;
	}

	ul {
		margin: 0;
		padding-left: var(--space-4);
		font-family: var(--font-mono);
	}

	a {
		align-self: flex-start;
		padding: var(--space-2) var(--space-3);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-control);
		background: var(--background-neutral-medium);
		color: var(--foreground-neutral-primary);
		text-decoration: none;
	}

	@keyframes status-arrive {
		from {
			opacity: 0;
			transform: translateY(0.25rem);
		}

		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
