import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../text/text';
import { Tabs } from './tabs';

const meta = {
	title: 'Disclosure/Tabs',
	component: Tabs,
	tags: ['autodocs'],
	args: {
		label: 'Bridge',
		children: null
	}
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	render: () => (
		<Tabs label="Bridge">
			<Tabs.List>
				<Tabs.Tab id="lights">Lights</Tabs.Tab>
				<Tabs.Tab id="rooms">Rooms</Tabs.Tab>
			</Tabs.List>
			<Tabs.Panel id="lights">
				<Text.Body1>Lights in this bridge.</Text.Body1>
			</Tabs.Panel>
			<Tabs.Panel id="rooms">
				<Text.Body1>Rooms in this bridge.</Text.Body1>
			</Tabs.Panel>
		</Tabs>
	)
};
