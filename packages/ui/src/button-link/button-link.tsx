import type { ReactNode, Ref } from 'react';
import { Link as AriaLink } from 'react-aria-components';

import buttonStyles from '../button/button.module.css';
import { cx } from '../lib/cx';
import { externalAnchorProps } from '../lib/external-href';
import surface from '../surface/surface.module.css';
import type { ButtonSize, ButtonTone, ButtonVariant } from '../button/button';

export type ButtonLinkProps = {
	href: string;
	children: ReactNode;
	tone?: ButtonTone;
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: string;
	ref?: Ref<HTMLAnchorElement>;
};

export function ButtonLink({
	href,
	children,
	tone = 'neutral',
	variant = 'primary',
	size = 'medium',
	className,
	ref
}: ButtonLinkProps) {
	return (
		<AriaLink
			ref={ref}
			href={href}
			className={cx(surface.surface, buttonStyles.button, className)}
			data-tone={tone}
			data-variant={variant}
			data-size={size}
			{...externalAnchorProps(href)}
		>
			{children}
		</AriaLink>
	);
}
