import type { ReactNode } from 'react';
import { Link } from 'react-aria-components';

import { cx } from '../lib/cx';
import styles from './link-tabs.module.css';

export type LinkTabsProps = {
	label: string;
	children: ReactNode;
	className?: string;
};

function LinkTabsRoot({ label, children, className }: LinkTabsProps) {
	return (
		<nav aria-label={label} className={cx(styles.nav, className)}>
			{children}
		</nav>
	);
}

export type LinkTabItemProps = {
	href: string;
	children: ReactNode;
	current?: boolean;
};

function Item({ href, children, current = false }: LinkTabItemProps) {
	return (
		<Link href={href} className={styles.item} aria-current={current ? 'page' : undefined}>
			{children}
		</Link>
	);
}

export const LinkTabs = Object.assign(LinkTabsRoot, { Item });
