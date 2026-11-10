import { useState } from 'react';
import {
	Token,
	TokenField as AriaTokenField,
	TokenFieldValue,
	TokenInput
} from 'react-aria-components';

import { Field, useFieldContext, type FieldChrome, type FieldControlProps } from '../field/field';
import styles from './token-field.module.css';

type Segment = { type: 'text'; text: string } | { type: 'token'; text: string; value: string };

class TagValue extends TokenFieldValue<string> {
	protected tokenize(text: string): Segment[] {
		const parts = text.split(',');
		const segments: Segment[] = [];

		for (let index = 0; index < parts.length; index += 1) {
			const part = parts[index];

			if (part === undefined) {
				continue;
			}

			const last = index === parts.length - 1;
			const trimmed = part.trim();

			if (!last && trimmed.length > 0) {
				segments.push({ type: 'token', text: trimmed, value: trimmed });
			}

			if (last) {
				segments.push({ type: 'text', text: part });
			}
		}

		if (segments.length === 0) {
			return [{ type: 'text', text: '' }];
		}

		return segments;
	}
}

export type TokenFieldProps = {
	label: string;
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	chrome?: FieldChrome;
	className?: string;
	disabled?: boolean;
	onChange?: (tokens: string[]) => void;
};

export function TokenField(props: TokenFieldProps) {
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
			<TokenControl {...control} />
		</Field>
	);
}

function TokenControl({
	'aria-describedby': describedBy,
	'aria-invalid': invalid,
	disabled,
	onChange
}: Omit<TokenFieldProps, 'label'> & FieldControlProps) {
	const field = useFieldContext();
	const [value, setValue] = useState(() => new TagValue([{ type: 'text', text: '' }]));

	return (
		<AriaTokenField
			aria-labelledby={field?.labelId}
			aria-describedby={describedBy ?? field?.describedBy}
			aria-invalid={invalid ?? (field?.invalid || undefined)}
			isDisabled={disabled}
			value={value}
			onChange={(next) => {
				setValue(next);
				onChange?.(
					next.segments.flatMap((segment) => (segment.type === 'token' ? [segment.text] : []))
				);
			}}
			className={styles.field}
		>
			<TokenInput>
				{(segment) =>
					segment.type === 'token' ? (
						<Token className={styles.token}>{segment.text}</Token>
					) : (
						<span className={styles.text}>{segment.text}</span>
					)
				}
			</TokenInput>
		</AriaTokenField>
	);
}
