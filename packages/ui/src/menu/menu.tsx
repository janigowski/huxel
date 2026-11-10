import type { ReactNode } from 'react';
import { Menu as AriaMenu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';

import { Button } from '../button/button';
import overlay from '../overlay/overlay.module.css';

export type MenuProps = {
	label: string;
	children: ReactNode;
};

function MenuRoot({ label, children }: MenuProps) {
	return (
		<MenuTrigger>
			<Button variant="secondary">{label}</Button>
			<Popover className={overlay.popover}>
				<AriaMenu className={overlay.list}>{children}</AriaMenu>
			</Popover>
		</MenuTrigger>
	);
}

export type MenuItemProps = {
	id: string;
	children: ReactNode;
	onAction?: () => void;
};

function Item({ id, children, onAction }: MenuItemProps) {
	return (
		<MenuItem id={id} className={overlay.option} onAction={onAction}>
			{children}
		</MenuItem>
	);
}

export const Menu = Object.assign(MenuRoot, { Item });
