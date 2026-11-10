import type { ReactNode } from 'react';

import { cx } from '../lib/cx';
import styles from './status-dot.module.css';

export type StatusDotTone = 'critical' | 'warning' | 'success' | 'neutral' | 'emphasis';

export type StatusDotProps = {
	children: ReactNode;
	tone?: StatusDotTone;
	className?: string;
};

export function StatusDot({ children, tone = 'neutral', className }: StatusDotProps) {
	return (
		<span className={cx(styles.status, className)} data-tone={tone}>
			{children}
		</span>
	);
}
