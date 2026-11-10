import type { Meta, StoryObj } from '@storybook/react-vite';

import { Progress } from './progress';

const meta = {
	title: 'Feedback/Progress',
	component: Progress,
	tags: ['autodocs'],
	args: {
		label: 'Upload',
		value: 40
	}
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
