import type { Meta, StoryObj } from '@storybook/react-vite';

import { Menu } from './menu';

const meta = {
	title: 'Overlays/Menu',
	component: Menu,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'Enter or Space opens the menu. Arrow keys move between actions. Enter activates the focused action. Escape closes the menu and returns focus to the trigger.'
			}
		}
	},
	args: {
		label: 'Actions',
		children: null
	}
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	render: () => (
		<Menu label="Actions">
			<Menu.Item id="rename" onAction={() => undefined}>
				Rename
			</Menu.Item>
			<Menu.Item id="duplicate" onAction={() => undefined}>
				Duplicate
			</Menu.Item>
		</Menu>
	)
};
