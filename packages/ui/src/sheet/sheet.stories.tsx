import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../text/text';
import { Sheet } from './sheet';

const meta = {
	title: 'Overlays/Sheet',
	component: Sheet,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'The trigger opens the sheet from the bottom at half the viewport. Drag the handle, or focus it and press Arrow Up and Arrow Down, to move between 10% and 90%. Escape dismisses the sheet. Content stays mounted until the close animation finishes.'
			}
		}
	},
	args: {
		label: 'Scenes',
		closeLabel: 'Close',
		trigger: 'Scenes',
		children: <Text.Body1>Scene list stays mounted while the sheet closes.</Text.Body1>
	}
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
