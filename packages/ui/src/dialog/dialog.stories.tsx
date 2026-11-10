import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../text/text';
import { Dialog } from './dialog';

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
	render: () => (
		<Dialog label="Settings" closeLabel="Close" trigger="Open settings">
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
		<Dialog label="Wide" closeLabel="Close" trigger="Large" size="large">
			<Dialog.Body>
				<Text.Body1>Large dialog.</Text.Body1>
			</Dialog.Body>
		</Dialog>
	)
};
