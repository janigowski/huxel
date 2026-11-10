import type { Meta, StoryObj } from '@storybook/react-vite';

import { Spinner } from './spinner';

const meta = {
	title: 'Feedback/Spinner',
	component: Spinner,
	tags: ['autodocs']
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	args: {
		label: 'Loading'
	}
};
