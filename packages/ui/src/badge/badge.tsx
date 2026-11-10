import type { ReactNode } from 'react';

import { cx } from '../lib/cx';
import surface from '../surface/surface.module.css';
import type { Tone, Variant } from '../types';
import styles from './badge.module.css';

export type BadgeTone = Tone;
export type BadgeVariant = Variant;

export type BadgeProps = {
	children: ReactNode;
	tone?: BadgeTone;
	variant?: BadgeVariant;
	className?: string;
};

export function Badge({
	children,
	tone = 'neutral',
	variant = 'secondary',
	className
}: BadgeProps) {
	return (
		<span
			className={cx(surface.surface, styles.badge, className)}
			data-tone={tone}
			data-variant={variant}
			data-readonly="true"
		>
			{children}
		</span>
	);
}
