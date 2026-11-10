import { Field, useFieldContext, type FieldChrome, type FieldControlProps } from '../field/field';
import fieldStyles from '../field/field.module.css';
import { cx } from '../lib/cx';
import styles from './text-area.module.css';

export type TextAreaProps = {
	label: string;
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	onClear?: () => void;
	chrome?: FieldChrome;
	className?: string;
	value?: string;
	defaultValue?: string;
	placeholder?: string;
	disabled?: boolean;
	onChange?: (value: string) => void;
};

export function TextArea({
	label,
	hint,
	error,
	warning,
	info,
	onClear,
	chrome,
	className,
	...control
}: TextAreaProps) {
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
			<AreaControl {...control} />
		</Field>
	);
}

function AreaControl({
	id,
	'aria-describedby': describedBy,
	'aria-invalid': invalid,
	value,
	defaultValue,
	placeholder,
	disabled,
	onChange
}: Omit<
	TextAreaProps,
	'label' | 'hint' | 'error' | 'warning' | 'info' | 'onClear' | 'chrome' | 'className'
> &
	FieldControlProps) {
	const field = useFieldContext();

	return (
		<textarea
			id={id ?? field?.controlId}
			className={cx(fieldStyles.input, styles.area)}
			value={value}
			defaultValue={defaultValue}
			placeholder={placeholder}
			disabled={disabled}
			aria-describedby={describedBy ?? field?.describedBy}
			aria-invalid={invalid ?? (field?.invalid || undefined)}
			onChange={(event) => {
				onChange?.(event.target.value);
			}}
		/>
	);
}
