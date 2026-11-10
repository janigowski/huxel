import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button/button';
import { Tooltip } from './tooltip';

const meta = {
	title: 'Overlays/Tooltip',
	component: Tooltip,
	tags: ['autodocs']
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	args: {
		content: 'Add a light',
		children: <Button>Hover</Button>
	},
	render: () => (
		<Tooltip content="Add a light">
			<Button>Hover</Button>
		</Tooltip>
	)
};
