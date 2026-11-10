import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Link } from './link';

const meta = {
	title: 'Actions/Link',
	component: Link,
	tags: ['autodocs'],
	args: {
		href: '/lights',
		children: 'Lights'
	}
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const External: Story = {
	render: () => (
		<div className={gallery.row}>
			<Link href="https://example.com">External</Link>
			<Link href="mailto:ada@example.com">Mail</Link>
		</div>
	)
};
