import type { DateValue } from '@internationalized/date';
import { DateField as AriaDateField, DateInput, DateSegment } from 'react-aria-components';

import { Field, useFieldContext, type FieldChrome, type FieldControlProps } from '../field/field';
import styles from './date-field.module.css';

export type DateFieldProps = {
	label: string;
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	chrome?: FieldChrome;
	className?: string;
	value?: DateValue | null;
	defaultValue?: DateValue | null;
	disabled?: boolean;
	onChange?: (value: DateValue | null) => void;
};

export function DateField(props: DateFieldProps) {
	const { label, hint, error, warning, info, chrome, className, ...control } = props;

	return (
		<Field
			label={label}
			hint={hint}
			error={error}
			warning={warning}
			info={info}
			chrome={chrome}
			className={className}
		>
			<DateControl {...control} />
		</Field>
	);
}

function DateControl({
	'aria-describedby': describedBy,
	'aria-invalid': invalid,
	value,
	defaultValue,
	disabled,
	onChange
}: Omit<DateFieldProps, 'label'> & FieldControlProps) {
	const field = useFieldContext();

	return (
		<AriaDateField
			aria-labelledby={field?.labelId}
			aria-describedby={describedBy ?? field?.describedBy}
			isInvalid={Boolean(invalid ?? field?.invalid)}
			isDisabled={disabled}
			value={value}
			defaultValue={defaultValue}
			onChange={onChange}
			granularity="day"
		>
			<DateInput className={styles.input}>
				{(segment) => <DateSegment segment={segment} className={styles.segment} />}
			</DateInput>
		</AriaDateField>
	);
}
