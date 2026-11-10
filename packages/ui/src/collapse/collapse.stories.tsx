import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../text/text';
import { Collapse } from './collapse';

const meta = {
	title: 'Disclosure/Collapse',
	component: Collapse,
	tags: ['autodocs'],
	args: {
		label: 'Advanced',
		children: <Text.Body1>Extra bridge settings.</Text.Body1>
	}
} satisfies Meta<typeof Collapse>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
