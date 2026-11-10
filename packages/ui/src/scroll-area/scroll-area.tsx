import { useEffect, useRef } from 'react';
import type { ReactNode, Ref } from 'react';
import { scrollTo } from '@huxel/tokens/scroll';

import { cx } from '../lib/cx';
import styles from './scroll-area.module.css';

export type ScrollAreaProps = {
	children: ReactNode;
	className?: string;
	scrollTop?: number;
	ref?: Ref<HTMLDivElement>;
};

export function ScrollArea({ children, className, scrollTop, ref }: ScrollAreaProps) {
	const localRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const node = localRef.current;

		if (!node || scrollTop === undefined) {
			return;
		}

		scrollTo(node, { top: scrollTop });
	}, [scrollTop]);

	return (
		<div
			ref={(node) => {
				localRef.current = node;

				if (typeof ref === 'function') {
					ref(node);

					return;
				}

				if (ref) {
					ref.current = node;
				}
			}}
			className={cx(styles.scroll, className)}
		>
			{children}
		</div>
	);
}
