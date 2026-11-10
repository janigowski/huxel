import type { Meta, StoryObj } from '@storybook/react-vite';

import { Select } from './select';

const items = [
	{ id: 'kitchen', label: 'Kitchen' },
	{ id: 'hall', label: 'Hall' },
	{ id: 'study', label: 'Study' }
];

const meta = {
	title: 'Form/Select',
	component: Select,
	tags: ['autodocs'],
	args: {
		label: 'Room',
		items
	}
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
