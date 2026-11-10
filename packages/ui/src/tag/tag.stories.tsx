import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Tag } from './tag';

const meta = {
	title: 'Status/Tag',
	component: Tag,
	tags: ['autodocs'],
	args: {
		children: 'Kitchen'
	}
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
	render: () => (
		<div className={gallery.row}>
			<Tag icon="check">Ready</Tag>
			<Tag loading>Syncing</Tag>
			<Tag asChild tone="emphasis">
				<a href="/rooms">Rooms</a>
			</Tag>
		</div>
	)
};
