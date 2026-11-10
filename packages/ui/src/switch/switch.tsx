import type { ReactNode } from 'react';
import { Switch as AriaSwitch } from 'react-aria-components';

import { cx } from '../lib/cx';
import styles from './switch.module.css';

export type SwitchProps = {
	children: ReactNode;
	className?: string;
	isSelected?: boolean;
	defaultSelected?: boolean;
	disabled?: boolean;
	onChange?: (selected: boolean) => void;
};

export function Switch({
	children,
	className,
	isSelected,
	defaultSelected,
	disabled,
	onChange
}: SwitchProps) {
	return (
		<AriaSwitch
			className={cx(styles.switch, className)}
			isSelected={isSelected}
			defaultSelected={defaultSelected}
			isDisabled={disabled}
			onChange={onChange}
		>
			<span className={styles.track} aria-hidden="true">
				<span className={styles.thumb} />
			</span>
			{children}
		</AriaSwitch>
	);
}
