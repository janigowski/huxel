import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Text } from '../text/text';
import { Dialog, type DialogSize } from './dialog';

const sizes: DialogSize[] = ['small', 'medium', 'large', 'screen'];

const meta = {
	title: 'Overlays/Dialog',
	component: Dialog,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'The trigger opens the dialog and moves focus inside. Tab stays within the dialog. Escape dismisses it. Focus returns to the trigger when it closes.'
			}
		}
	},
	args: {
		label: 'Settings',
		closeLabel: 'Close',
		trigger: 'Open settings',
		children: null
	}
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	render: (args) => (
		<Dialog
			label={args.label ?? 'Settings'}
			closeLabel={args.closeLabel ?? 'Close'}
			trigger={args.trigger ?? 'Open settings'}
			size={args.size}
			dismissable={args.dismissable}
		>
			<Dialog.Header>
				<Text.Heading3>Settings</Text.Heading3>
			</Dialog.Header>
			<Dialog.Body>
				<Text.Body1>Preferences for this bridge.</Text.Body1>
			</Dialog.Body>
		</Dialog>
	)
};

export const Sizes: Story = {
	render: () => (
		<div className={gallery.row}>
			{sizes.map((size) => (
				<Dialog key={size} label={size} closeLabel="Close" trigger={size} size={size}>
					<Dialog.Body>
						<Text.Body1>{size}</Text.Body1>
					</Dialog.Body>
				</Dialog>
			))}
		</div>
	)
};
