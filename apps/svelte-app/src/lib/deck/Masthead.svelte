<script lang="ts">
	interface Props {
		title: string;
		detail: string;
		note?: string;
		linked?: boolean;
		rooms?: number;
		zones?: number;
	}

	let { title, detail, note, linked = false, rooms, zones }: Props = $props();

	const summary = $derived.by(() => {
		if (!linked) {
			return detail;
		}

		const parts: string[] = [];

		if (rooms !== undefined) {
			parts.push(`${rooms} ${rooms === 1 ? 'room' : 'rooms'}`);
		}

		if (zones !== undefined) {
			parts.push(`${zones} ${zones === 1 ? 'zone' : 'zones'}`);
		}

		return parts.join(' · ');
	});
</script>

<section class="mast" aria-labelledby="deck-title">
	<div class="copy">
		<h1 id="deck-title">{title}</h1>
		<p class="summary">{summary}</p>
		{#if note}
			<p class="note">{note}</p>
		{/if}
	</div>

	{#if linked}
		<dl class="metrics">
			{#if rooms !== undefined}
				<div class="metric">
					<dt>{rooms === 1 ? 'Room' : 'Rooms'}</dt>
					<dd>{rooms}</dd>
				</div>
			{/if}
			{#if zones !== undefined}
				<div class="metric">
					<dt>{zones === 1 ? 'Zone' : 'Zones'}</dt>
					<dd>{zones}</dd>
				</div>
			{/if}
		</dl>
	{/if}
</section>

<style>
	.mast {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-6);
		padding-block: var(--space-8) var(--space-6);
	}

	.copy {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--space-2);
		min-width: min(100%, 16rem);
	}

	h1,
	.summary,
	.note {
		margin: 0;
	}

	h1 {
		font-size: var(--font-size-heading-1);
		font-weight: var(--font-weight-heading-1);
		letter-spacing: var(--tracking-heading-1);
		line-height: var(--line-height-heading-1);
	}

	.summary {
		max-width: 36rem;
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-1);
		line-height: var(--line-height-body-1);
	}

	.note {
		color: var(--foreground-neutral-tertiary);
		font-size: var(--font-size-body-2);
		line-height: var(--line-height-body-2);
	}

	.metrics {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
	}

	.metric {
		min-width: 5.5rem;
		padding: var(--space-3) var(--space-4);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-8);
		background: var(--background-neutral-medium);
	}

	dt,
	dd {
		margin: 0;
	}

	dt {
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-2);
		line-height: var(--line-height-body-2);
	}

	dd {
		margin-top: var(--space-1);
		font-family: var(--font-mono);
		font-size: var(--font-size-heading-2);
		font-weight: var(--font-weight-medium);
		letter-spacing: var(--tracking-heading-2);
		line-height: var(--line-height-heading-2);
	}
</style>
