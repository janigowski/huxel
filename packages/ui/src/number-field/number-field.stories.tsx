import type { Meta, StoryObj } from '@storybook/react-vite';

import { NumberField } from './number-field';

const meta = {
	title: 'Form/NumberField',
	component: NumberField,
	tags: ['autodocs'],
	args: {
		label: 'Brightness',
		defaultValue: 80,
		minValue: 0,
		maxValue: 100
	}
} satisfies Meta<typeof NumberField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
