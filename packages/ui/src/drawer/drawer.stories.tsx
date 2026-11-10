import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Text } from '../text/text';
import { Drawer } from './drawer';

const meta = {
	title: 'Overlays/Drawer',
	component: Drawer,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'The trigger opens the drawer and moves focus inside. Tab stays within the drawer. Escape dismisses it. Focus returns to the trigger when it closes.'
			}
		}
	},
	args: {
		label: 'Filters',
		closeLabel: 'Close',
		trigger: 'Filters',
		children: <Text.Body1>Filter the rooms.</Text.Body1>
	}
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const End: Story = {};

export const Start: Story = {
	render: () => (
		<div className={gallery.row}>
			<Drawer label="Navigation" closeLabel="Close" trigger="Start" side="start">
				<Text.Body1>Navigation</Text.Body1>
			</Drawer>
		</div>
	)
};
