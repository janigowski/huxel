<script lang="ts">
	import { Label } from 'design-system';

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
		padding: var(--space-2) var(--space-3);
		border: var(--rule-thin) solid var(--color-mint);
		background: none;
		color: var(--color-mint);
		font: inherit;
	}

	input::placeholder {
		color: var(--color-mint-muted);
	}

	input:focus-visible {
		outline: var(--rule-thin) solid var(--color-orange);
		outline-offset: var(--rule-thin);
	}

	button {
		padding: var(--space-2) var(--space-4);
		border: var(--rule-thin) solid var(--color-mint);
		background: none;
		color: var(--color-mint);
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.6;
		cursor: progress;
	}
</style>
