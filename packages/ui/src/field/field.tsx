import { cloneElement, createContext, isValidElement, useContext, useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';

import { Icon } from '../icon/icon';
import { cx } from '../lib/cx';
import styles from './field.module.css';

export type FieldChrome = 'default' | 'ghost';

export type FieldControlProps = {
	id?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
};

export type FieldContextValue = {
	labelId: string;
	controlId: string;
	describedBy?: string;
	invalid: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext(): FieldContextValue | null {
	return useContext(FieldContext);
}

export type FieldProps = {
	label: string;
	hint?: string;
	error?: string;
	warning?: string;
	info?: string;
	onClear?: () => void;
	chrome?: FieldChrome;
	className?: string;
	children: ReactElement;
};

export function Field({
	label,
	hint,
	error,
	warning,
	info,
	onClear,
	chrome = 'default',
	className,
	children
}: FieldProps) {
	const labelId = useId();
	const controlId = useId();
	const messageId = useId();
	const warningId = useId();
	const infoId = useId();
	const describedBy = error ? messageId : warning ? warningId : undefined;
	const context: FieldContextValue = {
		labelId,
		controlId,
		describedBy,
		invalid: Boolean(error)
	};
	const element = children as ReactElement<FieldControlProps>;
	const control = isValidElement<FieldControlProps>(element)
		? cloneElement(element, {
				id: element.props.id ?? controlId,
				'aria-describedby': element.props['aria-describedby'] ?? describedBy,
				'aria-invalid': error ? true : undefined
			})
		: children;

	return (
		<FieldContext.Provider value={context}>
			<div
				className={cx(styles.field, className)}
				data-chrome={chrome}
				data-invalid={error ? true : undefined}
				data-warning={!error && warning ? true : undefined}
			>
				<label id={labelId} className={styles.label} htmlFor={element.props.id ?? controlId}>
					{label}
				</label>
				<div className={styles.control}>
					{control}
					{onClear ? (
						<AriaButton className={styles.clear} aria-label={`Clear ${label}`} onPress={onClear}>
							<Icon name="close" />
						</AriaButton>
					) : null}
				</div>
				{hint ? <span className={styles.hint}>{hint}</span> : null}
				{error ? (
					<p id={messageId} className={styles.message} data-tone="critical">
						{error}
					</p>
				) : null}
				{warning ? (
					<p id={warningId} className={styles.message} data-tone="warning">
						{warning}
					</p>
				) : null}
				{info ? (
					<p id={infoId} className={styles.info}>
						{info}
					</p>
				) : null}
			</div>
		</FieldContext.Provider>
	);
}
