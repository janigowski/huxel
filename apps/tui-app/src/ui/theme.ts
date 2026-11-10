import { tokenValue } from '@huxel/tokens/values';

export const colors = {
	accent: tokenValue('--color-brand-500'),
	text: tokenValue('--foreground-neutral-primary'),
	muted: tokenValue('--foreground-neutral-secondary'),
	faint: tokenValue('--foreground-neutral-tertiary'),
	background: tokenValue('--background-default'),
	surface: tokenValue('--background-neutral-medium'),
	critical: tokenValue('--foreground-critical-primary'),
	success: tokenValue('--foreground-success-primary')
};
