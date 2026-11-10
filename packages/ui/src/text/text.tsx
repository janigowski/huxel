import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Focusable, Tooltip, TooltipTrigger } from 'react-aria-components';

import { cx } from '../lib/cx';
import tooltipStyles from '../tooltip/tooltip.module.css';
import styles from './text.module.css';

type TextProps = {
	children: ReactNode;
	className?: string;
};

function textPart(className: string, tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'p') {
	return function TextPart({ children, className: layout }: TextProps) {
		const Tag = tag;

		return <Tag className={cx(className, layout)}>{children}</Tag>;
	};
}

const Heading1 = textPart(styles.heading1 ?? '', 'h1');
const Heading2 = textPart(styles.heading2 ?? '', 'h2');
const Heading3 = textPart(styles.heading3 ?? '', 'h3');
const Heading4 = textPart(styles.heading4 ?? '', 'h4');
const Heading5 = textPart(styles.heading5 ?? '', 'h5');
const Body1 = textPart(styles.body1 ?? '', 'p');
const Body2 = textPart(styles.body2 ?? '', 'p');

export const Text = {
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Heading5,
	Body1,
	Body2
};

export type TruncateProps = {
	children: string;
	className?: string;
};

export function Truncate({ children, className }: TruncateProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const [overflow, setOverflow] = useState(false);

	useLayoutEffect(() => {
		const node = ref.current;

		if (!node) {
			return;
		}

		setOverflow(node.scrollWidth > node.clientWidth);
	}, [children]);

	if (!overflow) {
		return (
			<span ref={ref} className={cx(styles.truncate, className)}>
				{children}
			</span>
		);
	}

	return (
		<TooltipTrigger>
			<Focusable>
				<span ref={ref} className={cx(styles.truncate, className)}>
					{children}
				</span>
			</Focusable>
			<Tooltip className={tooltipStyles.tooltip}>{children}</Tooltip>
		</TooltipTrigger>
	);
}
