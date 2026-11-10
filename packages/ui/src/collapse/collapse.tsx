import type { ReactNode } from 'react';
import { Button, Disclosure, DisclosurePanel, Heading } from 'react-aria-components';

import { Icon } from '../icon/icon';
import { cx } from '../lib/cx';
import styles from './collapse.module.css';

export type CollapseProps = {
	label: string;
	children: ReactNode;
	className?: string;
	defaultExpanded?: boolean;
};

export function Collapse({ label, children, className, defaultExpanded }: CollapseProps) {
	return (
		<Disclosure className={cx(styles.collapse, className)} defaultExpanded={defaultExpanded}>
			<Heading>
				<Button slot="trigger" className={styles.trigger}>
					{label}
					<Icon name="chevron-down" />
				</Button>
			</Heading>
			<DisclosurePanel className={styles.panel}>{children}</DisclosurePanel>
		</Disclosure>
	);
}
