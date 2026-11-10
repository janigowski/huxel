import {
	Button,
	ListBox,
	ListBoxItem,
	Popover,
	Select as AriaSelect,
	SelectValue
} from 'react-aria-components';

import { Field, useFieldContext, type FieldChrome, type FieldControlProps } from '../field/field';
import { Icon } from '../icon/icon';
import overlay from '../overlay/overlay.module.css';
import fieldStyles from '../field/field.module.css';

export type SelectOption = {
	id: string;
	label: string;
};

export type SelectProps = {
	label: string;
	items: readonly SelectOption[];
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	onClear?: () => void;
	chrome?: FieldChrome;
	className?: string;
	selectedKey?: string;
	defaultSelectedKey?: string;
	disabled?: boolean;
	placeholder?: string;
	onChange?: (id: string) => void;
};

export function Select(props: SelectProps) {
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
			<SelectControl {...control} />
		</Field>
	);
}

function SelectControl({
	id,
	'aria-describedby': describedBy,
	'aria-invalid': invalid,
	items,
	selectedKey,
	defaultSelectedKey,
	disabled,
	placeholder,
	onChange
}: Omit<SelectProps, 'label'> & FieldControlProps) {
	const field = useFieldContext();

	return (
		<AriaSelect
			aria-labelledby={field?.labelId}
			aria-describedby={describedBy ?? field?.describedBy}
			isInvalid={Boolean(invalid ?? field?.invalid)}
			isDisabled={disabled}
			selectedKey={selectedKey}
			defaultSelectedKey={defaultSelectedKey}
			placeholder={placeholder}
			onSelectionChange={(key) => {
				if (key !== null) {
					onChange?.(String(key));
				}
			}}
			className={fieldStyles.input}
		>
			<Button id={id ?? field?.controlId} className={fieldStyles.input}>
				<SelectValue />
				<Icon name="chevron-down" />
			</Button>
			<Popover className={overlay.popover}>
				<ListBox className={overlay.list}>
					{items.map((item) => (
						<ListBoxItem
							key={item.id}
							id={item.id}
							textValue={item.label}
							className={overlay.option}
						>
							{item.label}
						</ListBoxItem>
					))}
				</ListBox>
			</Popover>
		</AriaSelect>
	);
}
