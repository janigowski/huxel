import type { IconName } from '@huxel/icons';
import type { Ref } from 'react';
import { Button as AriaButton } from 'react-aria-components';

import { Icon } from '../icon/icon';
import { cx } from '../lib/cx';
import { Spinner } from '../spinner/spinner';
import surface from '../surface/surface.module.css';
import { Tooltip } from '../tooltip/tooltip';
import type { Tone, Variant } from '../types';
import styles from './icon-button.module.css';

export type IconButtonTone = Tone;
export type IconButtonVariant = Variant;
export type IconButtonSize = 'xsmall' | 'small' | 'medium' | 'large';

export type IconButtonProps = {
	icon: IconName;
	label: string;
	tone?: IconButtonTone;
	variant?: IconButtonVariant;
	size?: IconButtonSize;
	loading?: boolean;
	disabled?: boolean;
	className?: string;
	type?: 'button' | 'submit' | 'reset';
	onPress?: () => void;
	ref?: Ref<HTMLButtonElement>;
};

export function IconButton({
	icon,
	label,
	tone = 'neutral',
	variant = 'primary',
	size = 'medium',
	loading = false,
	disabled = false,
	className,
	type = 'button',
	onPress,
	ref
}: IconButtonProps) {
	const isDisabled = disabled || loading;

	return (
		<Tooltip content={label}>
			<AriaButton
				ref={ref}
				type={type}
				aria-label={label}
				className={cx(surface.surface, styles.button, className)}
				isDisabled={isDisabled || undefined}
				{...(onPress ? { onPress } : null)}
				data-tone={tone}
				data-variant={variant}
				data-size={size}
				data-loading={loading ? true : undefined}
			>
				{loading ? <Spinner /> : <Icon name={icon} />}
			</AriaButton>
		</Tooltip>
	);
}
