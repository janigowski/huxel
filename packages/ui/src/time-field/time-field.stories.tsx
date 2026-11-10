import type { Meta, StoryObj } from '@storybook/react-vite';

import { TimeField } from './time-field';

const meta = {
	title: 'Form/TimeField',
	component: TimeField,
	tags: ['autodocs'],
	args: {
		label: 'Time'
	}
} satisfies Meta<typeof TimeField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
