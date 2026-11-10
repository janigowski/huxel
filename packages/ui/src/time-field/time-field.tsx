import { DateInput, DateSegment, TimeField as AriaTimeField } from 'react-aria-components';
import type { TimeValue } from 'react-aria-components';

import dateStyles from '../date-field/date-field.module.css';
import { Field, useFieldContext, type FieldChrome, type FieldControlProps } from '../field/field';

export type TimeFieldProps = {
	label: string;
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	chrome?: FieldChrome;
	className?: string;
	value?: TimeValue | null;
	defaultValue?: TimeValue | null;
	disabled?: boolean;
	onChange?: (value: TimeValue | null) => void;
};

export function TimeField(props: TimeFieldProps) {
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
			<TimeControl {...control} />
		</Field>
	);
}

function TimeControl({
	'aria-describedby': describedBy,
	'aria-invalid': invalid,
	value,
	defaultValue,
	disabled,
	onChange
}: Omit<TimeFieldProps, 'label'> & FieldControlProps) {
	const field = useFieldContext();

	return (
		<AriaTimeField
			aria-labelledby={field?.labelId}
			aria-describedby={describedBy ?? field?.describedBy}
			isInvalid={Boolean(invalid ?? field?.invalid)}
			isDisabled={disabled}
			value={value}
			defaultValue={defaultValue}
			onChange={onChange}
		>
			<DateInput className={dateStyles.input}>
				{(segment) => <DateSegment segment={segment} className={dateStyles.segment} />}
			</DateInput>
		</AriaTimeField>
	);
}
