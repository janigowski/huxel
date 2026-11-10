import {
	Button,
	ComboBox as AriaComboBox,
	Group,
	Input,
	ListBox,
	ListBoxItem,
	Popover
} from 'react-aria-components';

import { Field, useFieldContext, type FieldChrome, type FieldControlProps } from '../field/field';
import fieldStyles from '../field/field.module.css';
import { Icon } from '../icon/icon';
import { cx } from '../lib/cx';
import overlay from '../overlay/overlay.module.css';
import styles from './combo-box.module.css';

export type ComboBoxOption = {
	id: string;
	label: string;
};

export type ComboBoxProps = {
	label: string;
	items: readonly ComboBoxOption[];
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	onClear?: () => void;
	chrome?: FieldChrome;
	className?: string;
	disabled?: boolean;
	placeholder?: string;
	onChange?: (id: string | null) => void;
};

export function ComboBox(props: ComboBoxProps) {
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
			<ComboControl {...control} />
		</Field>
	);
}

function ComboControl({
	id,
	'aria-describedby': describedBy,
	'aria-invalid': invalid,
	items,
	disabled,
	placeholder,
	onChange
}: Omit<ComboBoxProps, 'label'> & FieldControlProps) {
	const field = useFieldContext();

	return (
		<AriaComboBox
			aria-labelledby={field?.labelId}
			aria-describedby={describedBy ?? field?.describedBy}
			isInvalid={Boolean(invalid ?? field?.invalid)}
			isDisabled={disabled}
			onSelectionChange={(key) => {
				onChange?.(key === null ? null : String(key));
			}}
			className={styles.box}
		>
			<Group className={styles.group}>
				<Input
					id={id ?? field?.controlId}
					className={fieldStyles.input}
					placeholder={placeholder}
				/>
				<Button className={styles.trigger}>
					<Icon name="chevron-down" />
				</Button>
			</Group>
			<Popover className={overlay.popover}>
				<ListBox className={overlay.list}>
					{items.map((item) => (
						<ListBoxItem
							key={item.id}
							id={item.id}
							textValue={item.label}
							className={cx(overlay.option)}
						>
							{item.label}
						</ListBoxItem>
					))}
				</ListBox>
			</Popover>
		</AriaComboBox>
	);
}
