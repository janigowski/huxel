import type { ReactNode } from 'react';
import { Checkbox as AriaCheckbox } from 'react-aria-components';

import { Icon } from '../icon/icon';
import { cx } from '../lib/cx';
import styles from './checkbox.module.css';

export type CheckboxProps = {
	children?: ReactNode;
	className?: string;
	isSelected?: boolean;
	defaultSelected?: boolean;
	disabled?: boolean;
	onChange?: (selected: boolean) => void;
	'aria-label'?: string;
};

export function Checkbox({
	children,
	className,
	isSelected,
	defaultSelected,
	disabled,
	onChange,
	'aria-label': ariaLabel
}: CheckboxProps) {
	return (
		<AriaCheckbox
			className={cx(styles.checkbox, className)}
			isSelected={isSelected}
			defaultSelected={defaultSelected}
			isDisabled={disabled}
			onChange={onChange}
			aria-label={ariaLabel}
		>
			<span className={styles.box} aria-hidden="true">
				<Icon name="check" />
			</span>
			{children}
		</AriaCheckbox>
	);
}
