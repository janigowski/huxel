import type { ReactNode } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components';

import { cx } from '../lib/cx';
import surface from '../surface/surface.module.css';
import styles from './button-group.module.css';

export type ButtonGroupSelection = 'single' | 'multiple';

export type ButtonGroupProps = {
	label: string;
	selection: ButtonGroupSelection;
	children: ReactNode;
	className?: string;
};

export function ButtonGroup({ label, selection, children, className }: ButtonGroupProps) {
	return (
		<ToggleButtonGroup
			aria-label={label}
			selectionMode={selection}
			className={cx(styles.group, className)}
		>
			{children}
		</ToggleButtonGroup>
	);
}

export type ButtonGroupItemProps = {
	id: string;
	children: ReactNode;
	className?: string;
};

export function ButtonGroupItem({ id, children, className }: ButtonGroupItemProps) {
	return (
		<ToggleButton
			id={id}
			className={cx(surface.surface, styles.item, className)}
			data-tone="neutral"
			data-variant="secondary"
			data-size="medium"
		>
			{children}
		</ToggleButton>
	);
}
