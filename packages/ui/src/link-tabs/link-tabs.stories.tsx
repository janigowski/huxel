import type { Meta, StoryObj } from '@storybook/react-vite';

import { LinkTabs } from './link-tabs';

const meta = {
	title: 'Disclosure/LinkTabs',
	component: LinkTabs,
	tags: ['autodocs'],
	args: {
		label: 'Sections',
		children: null
	}
} satisfies Meta<typeof LinkTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	render: () => (
		<LinkTabs label="Sections">
			<LinkTabs.Item href="/lights" current>
				Lights
			</LinkTabs.Item>
			<LinkTabs.Item href="/rooms">Rooms</LinkTabs.Item>
		</LinkTabs>
	)
};
