import { ProgressBar } from 'react-aria-components';

import styles from './progress.module.css';

export type ProgressProps = {
	label: string;
	value: number;
	className?: string;
};

export function Progress({ label, value, className }: ProgressProps) {
	return (
		<ProgressBar
			aria-label={label}
			value={value}
			minValue={0}
			maxValue={100}
			className={className ? `${styles.track} ${className}` : styles.track}
		>
			{({ percentage }) => <div className={styles.fill} style={{ width: `${percentage ?? 0}%` }} />}
		</ProgressBar>
	);
}
