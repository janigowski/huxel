import type { IconName } from '@huxel/icons';
import { cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { Icon } from '../icon/icon';
import { cx } from '../lib/cx';
import { Spinner } from '../spinner/spinner';
import surface from '../surface/surface.module.css';
import type { Tone, Variant } from '../types';
import styles from './tag.module.css';

export type TagTone = Tone;
export type TagVariant = Variant;

export type TagProps = {
	children: ReactNode;
	tone?: TagTone;
	variant?: TagVariant;
	icon?: IconName;
	loading?: boolean;
	asChild?: boolean;
	className?: string;
};

export function Tag({
	children,
	tone = 'neutral',
	variant = 'secondary',
	icon,
	loading = false,
	asChild = false,
	className
}: TagProps) {
	const paint = cx(surface.surface, styles.tag, className);
	const content = (
		<>
			{icon ? <Icon name={icon} /> : null}
			{loading ? <Spinner /> : null}
			{asChild && isValidElement(children)
				? (children as ReactElement<{ children?: ReactNode }>).props.children
				: children}
		</>
	);

	if (asChild && isValidElement(children)) {
		const child = children as ReactElement<{ className?: string; children?: ReactNode }>;

		return cloneElement(
			child as ReactElement<{
				className?: string;
				children?: ReactNode;
				'data-tone'?: TagProps['tone'];
				'data-variant'?: TagProps['variant'];
				'data-loading'?: boolean;
				'data-readonly'?: boolean;
			}>,
			{
				className: cx(paint, child.props.className),
				'data-tone': tone,
				'data-variant': variant,
				'data-loading': loading ? true : undefined,
				'data-readonly': true,
				children: content
			}
		);
	}

	return (
		<span
			className={paint}
			data-tone={tone}
			data-variant={variant}
			data-loading={loading ? true : undefined}
			data-readonly="true"
		>
			{content}
		</span>
	);
}
