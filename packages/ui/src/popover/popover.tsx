import type { ReactNode } from 'react';
import { Dialog, DialogTrigger, Popover as AriaPopover } from 'react-aria-components';

import { Button } from '../button/button';
import overlay from '../overlay/overlay.module.css';

export type PopoverProps = {
	label: string;
	trigger: string;
	children: ReactNode;
	className?: string;
};

export function Popover({ label, trigger, children, className }: PopoverProps) {
	return (
		<DialogTrigger>
			<Button variant="secondary">{trigger}</Button>
			<AriaPopover className={overlay.popover}>
				<Dialog aria-label={label} className={className}>
					{children}
				</Dialog>
			</AriaPopover>
		</DialogTrigger>
	);
}
