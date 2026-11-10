import { useState } from 'react';
import { FileTrigger } from 'react-aria-components';

import { Button } from '../button/button';
import { Field, type FieldChrome } from '../field/field';
import { Text } from '../text/text';
import styles from './file-field.module.css';

export type FileFieldTranslations = {
	browse: string;
	empty: string;
	remove: string;
};

export type FileFieldProps = {
	label: string;
	translations: FileFieldTranslations;
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	chrome?: FieldChrome;
	className?: string;
	disabled?: boolean;
	onSelect?: (file: File | null) => void;
};

export function FileField({
	label,
	translations,
	hint,
	error,
	warning,
	info,
	chrome,
	className,
	disabled,
	onSelect
}: FileFieldProps) {
	const [name, setName] = useState<string | null>(null);

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
			<div className={styles.row}>
				<Text.Body2>{name ?? translations.empty}</Text.Body2>
				<FileTrigger
					onSelect={(files) => {
						const file = files?.item(0) ?? null;
						setName(file?.name ?? null);
						onSelect?.(file);
					}}
				>
					<Button type="button" size="small" variant="secondary" disabled={disabled}>
						{translations.browse}
					</Button>
				</FileTrigger>
				{name ? (
					<Button
						type="button"
						size="small"
						variant="tertiary"
						onPress={() => {
							setName(null);
							onSelect?.(null);
						}}
					>
						{translations.remove}
					</Button>
				) : null}
			</div>
		</Field>
	);
}
