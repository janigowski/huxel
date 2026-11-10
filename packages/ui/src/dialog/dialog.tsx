import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { Dialog as AriaDialog, DialogTrigger, Modal } from 'react-aria-components';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { waitForExit } from '../lib/exit';
import overlay from '../overlay/overlay.module.css';
import { cx } from '../lib/cx';
import styles from './dialog.module.css';

export type DialogSize = 'small' | 'medium' | 'large' | 'screen';

type DialogChrome = {
	closeLabel: string;
};

const DialogChromeContext = createContext<DialogChrome | null>(null);

function useDialogChrome(): DialogChrome {
	const value = useContext(DialogChromeContext);

	if (value === null) {
		throw new Error('Dialog parts must render inside Dialog');
	}

	return value;
}

export type DialogProps = {
	label: string;
	closeLabel: string;
	trigger: string;
	size?: DialogSize;
	dismissable?: boolean;
	className?: string;
	children?: ReactNode;
};

function Header({ children }: { children: ReactNode }) {
	return <div className={styles.header}>{children}</div>;
}

function Body({ children }: { children: ReactNode }) {
	return <div className={styles.body}>{children}</div>;
}

function Close() {
	const { closeLabel } = useDialogChrome();

	return (
		<Button slot="close" aria-label={closeLabel} variant="tertiary" size="small">
			<Icon name="close" />
		</Button>
	);
}

function DialogRoot({
	label,
	closeLabel,
	trigger,
	size = 'medium',
	dismissable = true,
	className,
	children
}: DialogProps) {
	return (
		<DialogChromeContext.Provider value={{ closeLabel }}>
			<DialogTrigger>
				<Button variant="secondary">{trigger}</Button>
				<Modal isDismissable={dismissable} className={overlay.modal} onExit={waitForExit}>
					<AriaDialog aria-label={label} className={cx(styles.dialog, className)} data-size={size}>
						<div className={styles.toolbar}>
							<Close />
						</div>
						{children}
					</AriaDialog>
				</Modal>
			</DialogTrigger>
		</DialogChromeContext.Provider>
	);
}

export const Dialog = Object.assign(DialogRoot, {
	Header,
	Body,
	Close
});
