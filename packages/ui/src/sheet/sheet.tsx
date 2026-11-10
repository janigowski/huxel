import { useState } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { Dialog, DialogTrigger, Modal } from 'react-aria-components';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { cx } from '../lib/cx';
import { waitForExit } from '../lib/exit';
import overlay from '../overlay/overlay.module.css';
import styles from './sheet.module.css';

export type SheetProps = {
	label: string;
	closeLabel: string;
	trigger: string;
	children: ReactNode;
	className?: string;
};

function clampHeight(value: number): number {
	if (value < 10) {
		return 10;
	}

	if (value > 90) {
		return 90;
	}

	return value;
}

function SheetPanel({ label, closeLabel, children, className }: Omit<SheetProps, 'trigger'>) {
	const [height, setHeight] = useState(50);

	function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			setHeight((current) => clampHeight(current + 5));
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setHeight((current) => clampHeight(current - 5));
		}
	}

	function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
		const handle = event.currentTarget;
		const startY = event.clientY;
		const startHeight = height;
		handle.setPointerCapture(event.pointerId);

		function onMove(move: PointerEvent) {
			const viewport = window.innerHeight || 1;
			const delta = ((startY - move.clientY) / viewport) * 100;
			setHeight(clampHeight(startHeight + delta));
		}

		function onUp(up: PointerEvent) {
			if (handle.hasPointerCapture(up.pointerId)) {
				handle.releasePointerCapture(up.pointerId);
			}

			handle.removeEventListener('pointermove', onMove);
			handle.removeEventListener('pointerup', onUp);
		}

		handle.addEventListener('pointermove', onMove);
		handle.addEventListener('pointerup', onUp);
	}

	return (
		<Dialog
			aria-label={label}
			className={cx(styles.sheet, className)}
			style={{ height: `${height}vh` }}
		>
			<div
				className={styles.handle}
				role="slider"
				tabIndex={0}
				aria-label={label}
				aria-valuemin={10}
				aria-valuemax={90}
				aria-valuenow={Math.round(height)}
				onKeyDown={onKeyDown}
				onPointerDown={onPointerDown}
			/>
			<div className={styles.toolbar}>
				<Button slot="close" aria-label={closeLabel} variant="tertiary" size="small">
					<Icon name="close" />
				</Button>
			</div>
			<div className={styles.body}>{children}</div>
		</Dialog>
	);
}

export function Sheet({ label, closeLabel, trigger, children, className }: SheetProps) {
	return (
		<DialogTrigger>
			<Button variant="secondary">{trigger}</Button>
			<Modal isDismissable className={cx(overlay.modal, styles.overlay)} onExit={waitForExit}>
				<SheetPanel label={label} closeLabel={closeLabel} className={className}>
					{children}
				</SheetPanel>
			</Modal>
		</DialogTrigger>
	);
}
