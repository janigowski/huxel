import { cx } from '../lib/cx';
import styles from './skeleton.module.css';

export type SkeletonProps = {
	className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
	return <div className={cx(styles.skeleton, className)} aria-hidden="true" />;
}
