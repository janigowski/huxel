<script lang="ts">
	interface Props {
		title: string;
		detail: string;
		onCount: number | null;
		total: number | null;
		rooms?: number;
		zones?: number;
	}

	let { title, detail, onCount, total, rooms, zones }: Props = $props();

	const summary = $derived.by(() => {
		if (onCount === null || total === null) {
			return detail;
		}

		const parts = [`${onCount} of ${total} lights on`];

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
	<h1 id="deck-title">{title}</h1>
	<p class="summary">{summary}</p>
</section>

<style>
	.mast {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-block: var(--space-5) var(--space-6);
	}

	h1,
	.summary {
		margin: 0;
	}

	h1 {
		font-family: var(--font-display);
		font-size: var(--text-title);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--tracking-title);
		line-height: var(--leading-title);
	}

	.summary {
		max-width: 40rem;
		color: var(--color-mute);
		font-size: var(--text-body);
		line-height: var(--leading-body);
	}
</style>
