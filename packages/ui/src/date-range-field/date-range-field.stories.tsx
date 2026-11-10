import type { Meta, StoryObj } from '@storybook/react-vite';

import { DateRangeField } from './date-range-field';

const meta = {
	title: 'Form/DateRangeField',
	component: DateRangeField,
	tags: ['autodocs'],
	args: {
		label: 'Range'
	}
} satisfies Meta<typeof DateRangeField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
