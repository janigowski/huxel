import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from './switch';

const meta = {
	title: 'Form/Switch',
	component: Switch,
	tags: ['autodocs'],
	args: {
		children: 'Notifications'
	}
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const On: Story = {
	args: {
		defaultSelected: true
	}
};
