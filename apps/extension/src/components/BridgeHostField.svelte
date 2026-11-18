<script lang="ts">
	import { Label } from '@huxel/design-system';

	interface Props {
		value: string;
		disabled?: boolean;
		onsubmit: () => void;
	}

	let { value = $bindable(), disabled = false, onsubmit }: Props = $props();

	const id = $props.id();
</script>

<div class="field">
	<label for={id}><Label>Bridge address</Label></label>

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
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
	}

	input {
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
</style>
