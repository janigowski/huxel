import type { Meta, StoryObj } from '@storybook/react-vite';

import { TokenField } from './token-field';

const meta = {
	title: 'Form/TokenField',
	component: TokenField,
	tags: ['autodocs'],
	args: {
		label: 'Tags'
	}
} satisfies Meta<typeof TokenField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
