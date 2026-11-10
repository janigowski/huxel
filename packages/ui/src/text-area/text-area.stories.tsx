import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextArea } from './text-area';

const meta = {
	title: 'Form/TextArea',
	component: TextArea,
	tags: ['autodocs'],
	args: {
		label: 'Note',
		placeholder: 'What changed'
	}
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
