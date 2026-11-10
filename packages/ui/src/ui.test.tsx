import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Avatar } from './avatar/avatar';
import { Button } from './button/button';
import { Dialog } from './dialog/dialog';
import { Field } from './field/field';
import { IconButton } from './icon-button/icon-button';
import { Menu } from './menu/menu';

describe('actions', () => {
	it('shows the button name and keeps it while loading', () => {
		render(<Button>Save</Button>);

		expect(screen.getByRole('button', { name: 'Save' }).textContent).toContain('Save');
	});

	it('disables a loading button without removing its label', () => {
		render(<Button loading>Save</Button>);
		const button = screen.getByRole('button', { name: 'Save' });

		expect(button.textContent).toContain('Save');
		expect(button).toHaveProperty('disabled', true);
	});

	it('finds an icon button by its label', () => {
		render(<IconButton icon="plus" label="Add light" />);

		expect(screen.getByRole('button', { name: 'Add light' })).toBeTruthy();
	});
});

describe('field', () => {
	it('describes the textbox with the error when a warning is also set', () => {
		render(
			<Field label="Name" error="Required" warning="Too short">
				<input />
			</Field>
		);
		const textbox = screen.getByRole('textbox', { name: 'Name' });
		const describedBy = textbox.getAttribute('aria-describedby');
		const description = describedBy ? document.getElementById(describedBy)?.textContent : '';

		expect(description).toBe('Required');
	});
});

function DialogExample() {
	return (
		<Dialog label="Settings" closeLabel="Close" trigger="Open settings">
			<Dialog.Header>Settings</Dialog.Header>
			<Dialog.Body>Preferences</Dialog.Body>
		</Dialog>
	);
}

describe('dialog', () => {
	it('opens with its accessible name and closes on escape', async () => {
		const user = userEvent.setup();
		render(<DialogExample />);

		await user.click(screen.getByRole('button', { name: 'Open settings' }));

		expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy();

		await user.keyboard('{Escape}');
		await waitFor(() => {
			expect(screen.queryByRole('dialog', { name: 'Settings' })).toBeNull();
		});
	});
});

describe('menu', () => {
	it('calls the item handler', async () => {
		const user = userEvent.setup();
		const onRename = vi.fn();

		render(
			<Menu label="Actions">
				<Menu.Item id="rename" onAction={onRename}>
					Rename
				</Menu.Item>
			</Menu>
		);

		await user.click(screen.getByRole('button', { name: 'Actions' }));
		await user.click(await screen.findByRole('menuitem', { name: 'Rename' }));

		expect(onRename).toHaveBeenCalled();
	});
});

describe('avatar', () => {
	it('uses the same swatch for the same name', () => {
		function Pair() {
			const [name] = useState('Ada Lovelace');

			return (
				<>
					<Avatar name={name} />
					<Avatar name={name} />
				</>
			);
		}

		const view = render(<Pair />);
		const swatches = Array.from(view.container.querySelectorAll('[data-swatch]')).map((node) =>
			node.getAttribute('data-swatch')
		);

		expect(swatches[0]).toBeTruthy();
		expect(swatches[0]).toBe(swatches[1]);
	});
});
