import type { ReactNode } from 'react';
import { Label, Radio as AriaRadio, RadioGroup as AriaRadioGroup } from 'react-aria-components';

import { cx } from '../lib/cx';
import styles from './radio-group.module.css';

export type RadioGroupProps = {
	label: string;
	children: ReactNode;
	value?: string;
	defaultValue?: string;
	disabled?: boolean;
	className?: string;
	onChange?: (value: string) => void;
};

export function RadioGroup({
	label,
	children,
	value,
	defaultValue,
	disabled,
	className,
	onChange
}: RadioGroupProps) {
	return (
		<AriaRadioGroup
			className={cx(styles.group, className)}
			value={value}
			defaultValue={defaultValue}
			isDisabled={disabled}
			onChange={onChange}
		>
			<Label className={styles.legend}>{label}</Label>
			{children}
		</AriaRadioGroup>
	);
}

export type RadioProps = {
	value: string;
	children: ReactNode;
	className?: string;
};

export function Radio({ value, children, className }: RadioProps) {
	return (
		<AriaRadio value={value} className={cx(styles.radio, className)}>
			<span className={styles.mark} aria-hidden="true" />
			{children}
		</AriaRadio>
	);
}
