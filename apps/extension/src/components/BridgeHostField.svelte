<script lang="ts">
	import { Label } from '@huxel/design-system';

	interface Props {
		value: string;
		discovering: boolean;
		disabled?: boolean;
		ondiscover: () => void;
		onsubmit: () => void;
	}

	let {
		value = $bindable(),
		discovering,
		disabled = false,
		ondiscover,
		onsubmit
	}: Props = $props();

	const id = $props.id();
</script>

<div class="field">
	<label for={id}><Label>Bridge address</Label></label>

	<div class="row">
		<input
			{id}
			type="text"
			inputmode="url"
			autocomplete="off"
			spellcheck="false"
			placeholder="192.168.1.10"
			bind:value
			{disabled}
			onkeydown={(event) => {
				if (event.key === 'Enter') {
					onsubmit();
				}
			}}
		/>
		<button type="button" onclick={ondiscover} disabled={discovering || disabled}>
			<Label>{discovering ? 'Searching…' : 'Find'}</Label>
		</button>
	</div>
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
	}

	.row {
		display: flex;
		gap: var(--space-2);
	}

	input {
		flex: 1;
		min-width: 0;
		min-height: var(--size-large);
		padding: var(--space-2) var(--space-3);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-control);
		background: var(--background-default);
		color: var(--foreground-neutral-primary);
		font: inherit;
	}

	input::placeholder {
		color: var(--foreground-neutral-tertiary);
	}

	button {
		min-height: var(--size-large);
		padding: var(--space-2) var(--space-4);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-control);
		background: transparent;
		color: var(--foreground-neutral-primary);
		cursor: pointer;
	}

	button:disabled {
		color: var(--foreground-neutral-disabled);
		cursor: progress;
	}
</style>
