import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../text/text';
import { Panel } from './panel';

const meta = {
	title: 'Layout/Panel',
	component: Panel,
	tags: ['autodocs'],
	args: {
		children: null
	}
} satisfies Meta<typeof Panel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	render: () => (
		<Panel tone="neutral">
			<Panel.Header>
				<Text.Heading4>Bridge</Text.Heading4>
			</Panel.Header>
			<Panel.Body>
				<Text.Body1>Connected</Text.Body1>
			</Panel.Body>
		</Panel>
	)
};
