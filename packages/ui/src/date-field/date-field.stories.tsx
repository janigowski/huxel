import type { Meta, StoryObj } from '@storybook/react-vite';

import { DateField } from './date-field';

const meta = {
	title: 'Form/DateField',
	component: DateField,
	tags: ['autodocs'],
	args: {
		label: 'Date'
	}
} satisfies Meta<typeof DateField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
