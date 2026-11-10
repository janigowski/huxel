import { Icon } from '../icon/icon';
import { cx } from '../lib/cx';
import styles from './brand.module.css';

export type WordmarkProduct = 'client' | 'app' | 'tui' | 'extension' | 'mcp';

export type WordmarkProps = {
	product?: WordmarkProduct;
	className?: string;
};

export function Wordmark({ product, className }: WordmarkProps) {
	return (
		<span className={cx(styles.wordmark, className)}>
			huxel
			{product ? (
				<>
					<span className={styles.sep} aria-hidden="true">
						//
					</span>
					{product}
				</>
			) : null}
		</span>
	);
}

export type MarkProps = {
	className?: string;
	label?: string;
};

export function Mark({ className, label }: MarkProps) {
	return (
		<span className={cx(styles.mark, className)}>
			<Icon name="mark" label={label} className={styles.fill} />
		</span>
	);
}
