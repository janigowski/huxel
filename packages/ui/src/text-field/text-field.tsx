import { Field, type FieldChrome, type FieldControlProps } from '../field/field';
import { useFieldContext } from '../field/field';
import fieldStyles from '../field/field.module.css';

type Messages = {
	label: string;
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	onClear?: () => void;
	chrome?: FieldChrome;
	className?: string;
};

export type TextFieldProps = Messages & {
	value?: string;
	defaultValue?: string;
	placeholder?: string;
	disabled?: boolean;
	type?: 'text' | 'email' | 'password' | 'search' | 'url';
	onChange?: (value: string) => void;
};

export function TextField({
	label,
	hint,
	error,
	warning,
	info,
	onClear,
	chrome,
	className,
	...control
}: TextFieldProps) {
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
			<TextControl {...control} />
		</Field>
	);
}

function TextControl({
	id,
	'aria-describedby': describedBy,
	'aria-invalid': invalid,
	value,
	defaultValue,
	placeholder,
	disabled,
	type = 'text',
	onChange
}: Omit<
	TextFieldProps,
	'label' | 'hint' | 'error' | 'warning' | 'info' | 'onClear' | 'chrome' | 'className'
> &
	FieldControlProps) {
	const field = useFieldContext();

	return (
		<input
			id={id ?? field?.controlId}
			className={fieldStyles.input}
			type={type}
			value={value}
			defaultValue={defaultValue}
			placeholder={placeholder}
			disabled={disabled}
			aria-describedby={describedBy ?? field?.describedBy}
			aria-invalid={invalid ?? (field?.invalid || undefined)}
			data-disabled={disabled || undefined}
			onChange={(event) => {
				onChange?.(event.target.value);
			}}
		/>
	);
}
