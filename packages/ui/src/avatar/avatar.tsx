import { Children } from 'react';
import type { ReactNode } from 'react';

import { Icon } from '../icon/icon';
import { cx } from '../lib/cx';
import styles from './avatar.module.css';

const swatchCount = 8;

const ink: Record<number, 'dark' | 'light'> = {
	0: 'dark',
	1: 'light',
	2: 'light',
	3: 'light',
	4: 'light',
	5: 'light',
	6: 'dark',
	7: 'light'
};

export function swatchFor(name: string): number {
	let hash = 0;

	for (const char of name) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	}

	return hash % swatchCount;
}

function initials(name: string): string {
	const parts = name
		.trim()
		.split(/\s+/)
		.filter((part) => part.length > 0);
	const first = parts[0];

	if (first === undefined) {
		return '';
	}

	const last = parts[parts.length - 1];

	if (parts.length === 1 || last === undefined) {
		return first.slice(0, 2).toUpperCase();
	}

	return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export type AvatarProps = {
	name?: string;
	src?: string;
	className?: string;
};

export function Avatar({ name = '', src, className }: AvatarProps) {
	const swatch = swatchFor(name);
	const letters = initials(name);
	const inkTone = ink[swatch] ?? 'light';

	return (
		<span
			className={cx(styles.avatar, className)}
			data-swatch={swatch}
			data-ink={inkTone}
			role={name ? 'img' : undefined}
			aria-label={name || undefined}
		>
			{src ? (
				<img className={styles.image} src={src} alt="" />
			) : letters ? (
				letters
			) : (
				<Icon name="person" />
			)}
		</span>
	);
}

export type AvatarStackProps = {
	children: ReactNode;
	max?: number;
	className?: string;
};

export function AvatarStack({ children, max = 3, className }: AvatarStackProps) {
	const items = Children.toArray(children);
	const visible = items.slice(0, max);
	const hidden = items.length - visible.length;

	return (
		<div className={cx(styles.stack, className)}>
			{visible}
			{hidden > 0 ? (
				<span className={styles.count} data-swatch="5" data-ink="light">
					+{hidden}
				</span>
			) : null}
		</div>
	);
}
