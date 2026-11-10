import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Separator } from './separator';

const meta = {
	title: 'Layout/Separator',
	component: Separator,
	tags: ['autodocs']
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};

export const Vertical: Story = {
	args: {
		orientation: 'vertical'
	},
	render: (args) => (
		<div className={gallery.viewport}>
			<Separator {...args} />
		</div>
	)
};
