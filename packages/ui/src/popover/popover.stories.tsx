import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../text/text';
import { Popover } from './popover';

const meta = {
	title: 'Overlays/Popover',
	component: Popover,
	tags: ['autodocs'],
	args: {
		label: 'Details',
		trigger: 'Details',
		children: <Text.Body1>Brightness stays with this light.</Text.Body1>
	}
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
