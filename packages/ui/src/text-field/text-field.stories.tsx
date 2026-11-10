import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextField } from './text-field';

const meta = {
	title: 'Form/TextField',
	component: TextField,
	tags: ['autodocs'],
	args: {
		label: 'Room name'
	}
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Invalid: Story = {
	args: {
		error: 'Required',
		warning: 'Too short'
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
