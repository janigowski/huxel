import type { Meta, StoryObj } from '@storybook/react-vite';

import { ComboBox } from './combo-box';

const meta = {
	title: 'Form/ComboBox',
	component: ComboBox,
	tags: ['autodocs'],
	args: {
		label: 'Room',
		placeholder: 'Search rooms',
		items: [
			{ id: 'kitchen', label: 'Kitchen' },
			{ id: 'hall', label: 'Hall' },
			{ id: 'study', label: 'Study' }
		]
	},
	parameters: {
		docs: {
			description: {
				component:
					'Type to filter the options. Arrow Down opens the list and moves through options. Enter selects the focused option. Escape closes the list.'
			}
		}
	}
} satisfies Meta<typeof ComboBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
