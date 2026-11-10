import type { ReactNode, Ref } from 'react';
import { Link as AriaLink } from 'react-aria-components';

import { cx } from '../lib/cx';
import { externalAnchorProps } from '../lib/external-href';
import styles from './link.module.css';

export type LinkProps = {
	href: string;
	children: ReactNode;
	className?: string;
	ref?: Ref<HTMLAnchorElement>;
};

export function Link({ href, children, className, ref }: LinkProps) {
	return (
		<AriaLink
			ref={ref}
			href={href}
			className={cx(styles.link, className)}
			{...externalAnchorProps(href)}
		>
			{children}
		</AriaLink>
	);
}
