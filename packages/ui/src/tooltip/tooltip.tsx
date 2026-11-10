import type { ReactElement } from 'react';
import { Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';

import styles from './tooltip.module.css';

export type TooltipProps = {
	content: string;
	children: ReactElement;
};

export function Tooltip({ content, children }: TooltipProps) {
	return (
		<TooltipTrigger>
			{children}
			<AriaTooltip className={styles.tooltip}>{content}</AriaTooltip>
		</TooltipTrigger>
	);
}
