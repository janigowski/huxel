import type { DateValue } from '@internationalized/date';
import { DateInput, DateRangePicker, DateSegment, Group } from 'react-aria-components';

import dateStyles from '../date-field/date-field.module.css';
import { Field, useFieldContext, type FieldChrome, type FieldControlProps } from '../field/field';
import styles from './date-range-field.module.css';

export type DateRangeValue = {
	start: DateValue;
	end: DateValue;
};

export type DateRangeFieldProps = {
	label: string;
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	chrome?: FieldChrome;
	className?: string;
	value?: DateRangeValue | null;
	defaultValue?: DateRangeValue | null;
	disabled?: boolean;
	onChange?: (value: DateRangeValue | null) => void;
};

export function DateRangeField(props: DateRangeFieldProps) {
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
			<RangeControl {...control} />
		</Field>
	);
}

function RangeControl({
	id,
	'aria-describedby': describedBy,
	'aria-invalid': invalid,
	value,
	defaultValue,
	disabled,
	onChange
}: Omit<DateRangeFieldProps, 'label'> & FieldControlProps) {
	const field = useFieldContext();

	return (
		<DateRangePicker
			aria-labelledby={field?.labelId}
			aria-describedby={describedBy ?? field?.describedBy}
			isInvalid={Boolean(invalid ?? field?.invalid)}
			isDisabled={disabled}
			value={value}
			defaultValue={defaultValue}
			onChange={onChange}
		>
			<Group id={id ?? field?.controlId} className={styles.group}>
				<DateInput slot="start" className={dateStyles.input}>
					{(segment) => <DateSegment segment={segment} className={dateStyles.segment} />}
				</DateInput>
				<span aria-hidden="true" className={styles.sep}>
					–
				</span>
				<DateInput slot="end" className={dateStyles.input}>
					{(segment) => <DateSegment segment={segment} className={dateStyles.segment} />}
				</DateInput>
			</Group>
		</DateRangePicker>
	);
}
