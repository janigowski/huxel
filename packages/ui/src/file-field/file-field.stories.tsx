import type { Meta, StoryObj } from '@storybook/react-vite';

import { FileField } from './file-field';

const meta = {
	title: 'Form/FileField',
	component: FileField,
	tags: ['autodocs'],
	args: {
		label: 'Schedule',
		translations: {
			browse: 'Choose file',
			empty: 'No file selected',
			remove: 'Remove file'
		}
	}
} satisfies Meta<typeof FileField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
