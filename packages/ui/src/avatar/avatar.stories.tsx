import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Avatar, AvatarStack } from './avatar';

const meta = {
	title: 'Identity/Avatar',
	component: Avatar,
	tags: ['autodocs'],
	args: {
		name: 'Ada Lovelace'
	}
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Fallbacks: Story = {
	render: () => (
		<div className={gallery.row}>
			<Avatar name="Ada Lovelace" />
			<Avatar name="Grace Hopper" />
			<Avatar />
		</div>
	)
};

export const Stack: Story = {
	render: () => (
		<AvatarStack max={2}>
			<Avatar name="Ada Lovelace" />
			<Avatar name="Grace Hopper" />
			<Avatar name="Alan Turing" />
			<Avatar name="Katherine Johnson" />
		</AvatarStack>
	)
};
