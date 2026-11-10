import { cloneElement, isValidElement } from 'react';
import type { ComponentProps, ReactElement, ReactNode, Ref } from 'react';
import { Button as AriaButton, Link as AriaLink } from 'react-aria-components';

import { cx } from '../lib/cx';
import { externalAnchorProps } from '../lib/external-href';
import { Spinner } from '../spinner/spinner';
import surface from '../surface/surface.module.css';
import type { Tone, Variant } from '../types';
import styles from './button.module.css';

export type ButtonTone = Tone;
export type ButtonVariant = Variant;
export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

type AriaPassthrough = Omit<
	ComponentProps<typeof AriaButton>,
	'children' | 'className' | 'isDisabled' | 'isPending' | 'onPress' | 'render' | 'style' | 'type'
>;

export type ButtonProps = AriaPassthrough & {
	tone?: ButtonTone;
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	disabled?: boolean;
	className?: string;
	children?: ReactNode;
	type?: 'button' | 'submit' | 'reset';
	onPress?: () => void;
	asChild?: boolean;
	ref?: Ref<HTMLButtonElement>;
};

export function Button({
	tone = 'neutral',
	variant = 'primary',
	size = 'medium',
	loading = false,
	disabled = false,
	className,
	children,
	type = 'button',
	onPress,
	asChild = false,
	ref,
	...rest
}: ButtonProps) {
	const isDisabled = disabled || loading;
	const paint = cx(surface.surface, styles.button, className);
	const child =
		asChild && isValidElement(children)
			? (children as ReactElement<{ className?: string; children?: ReactNode; href?: string }>)
			: null;
	const content = (
		<>
			{loading ? <Spinner /> : null}
			{child ? child.props.children : children}
		</>
	);

	if (child?.type === 'a') {
		const href = child.props.href ?? '';

		return (
			<AriaLink
				{...externalAnchorProps(href)}
				href={href}
				className={paint}
				isDisabled={isDisabled}
				data-tone={tone}
				data-variant={variant}
				data-size={size}
				data-loading={loading ? true : undefined}
				render={(domProps) => {
					const domClassName =
						typeof domProps.className === 'string' ? domProps.className : undefined;

					return cloneElement(child, {
						...domProps,
						className: cx(domClassName, child.props.className),
						children: content
					});
				}}
			>
				{content}
			</AriaLink>
		);
	}

	return (
		<AriaButton
			{...rest}
			ref={ref}
			type={type}
			className={paint}
			isDisabled={isDisabled || undefined}
			{...(onPress ? { onPress } : null)}
			data-tone={tone}
			data-variant={variant}
			data-size={size}
			data-loading={loading ? true : undefined}
			render={
				child
					? (domProps) => {
							const domClassName =
								typeof domProps.className === 'string' ? domProps.className : undefined;

							return cloneElement(child, {
								...domProps,
								className: cx(domClassName, child.props.className),
								children: content
							});
						}
					: undefined
			}
		>
			{content}
		</AriaButton>
	);
}
