import { Separator as AriaSeparator } from 'react-aria-components';

import { cx } from '../lib/cx';
import styles from './separator.module.css';

export type SeparatorProps = {
	orientation?: 'horizontal' | 'vertical';
	className?: string;
};

export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
	return <AriaSeparator orientation={orientation} className={cx(styles.separator, className)} />;
}
