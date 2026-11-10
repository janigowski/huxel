import type { ReactNode } from 'react';
import { Tab as AriaTab, TabList, TabPanel, Tabs as AriaTabs } from 'react-aria-components';

import { cx } from '../lib/cx';
import surface from '../surface/surface.module.css';
import styles from './tabs.module.css';

export type TabsProps = {
	children: ReactNode;
	className?: string;
	label?: string;
};

function TabsRoot({ children, className, label }: TabsProps) {
	return (
		<AriaTabs className={cx(styles.tabs, className)} aria-label={label}>
			{children}
		</AriaTabs>
	);
}

function List({ children, className }: { children: ReactNode; className?: string }) {
	return <TabList className={cx(styles.list, className)}>{children}</TabList>;
}

function Tab({ id, children }: { id: string; children: ReactNode }) {
	return (
		<AriaTab
			id={id}
			className={cx(surface.surface, styles.tab)}
			data-tone="neutral"
			data-variant="tertiary"
			data-size="medium"
		>
			{children}
		</AriaTab>
	);
}

function Panel({ id, children }: { id: string; children: ReactNode }) {
	return (
		<TabPanel id={id} className={styles.panel}>
			{children}
		</TabPanel>
	);
}

export const Tabs = Object.assign(TabsRoot, { List, Tab, Panel });
