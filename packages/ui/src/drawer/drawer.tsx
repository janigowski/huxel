import type { ReactNode } from 'react';
import { Dialog, DialogTrigger, Modal } from 'react-aria-components';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { cx } from '../lib/cx';
import overlay from '../overlay/overlay.module.css';
import styles from './drawer.module.css';

export type DrawerSide = 'start' | 'end';

export type DrawerProps = {
	label: string;
	closeLabel: string;
	trigger: string;
	side?: DrawerSide;
	children: ReactNode;
	className?: string;
};

export function Drawer({
	label,
	closeLabel,
	trigger,
	side = 'end',
	children,
	className
}: DrawerProps) {
	return (
		<DialogTrigger>
			<Button variant="secondary">{trigger}</Button>
			<Modal isDismissable className={cx(overlay.modal, styles.overlay)}>
				<Dialog aria-label={label} className={cx(styles.drawer, className)} data-side={side}>
					<div className={styles.toolbar}>
						<Button slot="close" aria-label={closeLabel} variant="tertiary" size="small">
							<Icon name="close" />
						</Button>
					</div>
					{children}
				</Dialog>
			</Modal>
		</DialogTrigger>
	);
}
