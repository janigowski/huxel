import { Button, Group, Input, NumberField as AriaNumberField } from 'react-aria-components';

import { Field, useFieldContext, type FieldChrome, type FieldControlProps } from '../field/field';
import fieldStyles from '../field/field.module.css';
import { Icon } from '../icon/icon';
import styles from './number-field.module.css';

export type NumberFieldProps = {
	label: string;
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	onClear?: () => void;
	chrome?: FieldChrome;
	className?: string;
	value?: number;
	defaultValue?: number;
	minValue?: number;
	maxValue?: number;
	disabled?: boolean;
	onChange?: (value: number) => void;
};

export function NumberField(props: NumberFieldProps) {
	const { label, hint, error, warning, info, onClear, chrome, className, ...control } = props;

	return (
		<Field
			label={label}
			hint={hint}
			error={error}
			warning={warning}
			info={info}
			onClear={onClear}
			chrome={chrome}
			className={className}
		>
			<NumberControl {...control} />
		</Field>
	);
}

function NumberControl({
	id,
	'aria-describedby': describedBy,
	'aria-invalid': invalid,
	value,
	defaultValue,
	minValue,
	maxValue,
	disabled,
	onChange
}: Omit<NumberFieldProps, 'label'> & FieldControlProps) {
	const field = useFieldContext();

	return (
		<AriaNumberField
			aria-labelledby={field?.labelId}
			aria-describedby={describedBy ?? field?.describedBy}
			isInvalid={Boolean(invalid ?? field?.invalid)}
			isDisabled={disabled}
			value={value}
			defaultValue={defaultValue}
			minValue={minValue}
			maxValue={maxValue}
			onChange={onChange}
			className={styles.group}
		>
			<Group className={styles.group}>
				<Button slot="decrement" className={styles.step}>
					<Icon name="minus" />
				</Button>
				<Input id={id ?? field?.controlId} className={fieldStyles.input} />
				<Button slot="increment" className={styles.step}>
					<Icon name="plus" />
				</Button>
			</Group>
		</AriaNumberField>
	);
}
