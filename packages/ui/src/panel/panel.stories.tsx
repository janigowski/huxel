import type { Meta, StoryObj } from '@storybook/react-vite';

import type { CardTone } from '../card/card';
import gallery from '../stories/gallery.module.css';
import { Text } from '../text/text';
import { Panel } from './panel';

const tones: CardTone[] = [
	'neutral',
	'emphasis',
	'featured',
	'critical',
	'warning',
	'success',
	'neutral-inverted'
];

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
	render: (args) => (
		<Panel tone={args.tone}>
			<Panel.Header>
				<Text.Heading4>Bridge</Text.Heading4>
			</Panel.Header>
			<Panel.Body>
				<Text.Body1>Connected</Text.Body1>
			</Panel.Body>
		</Panel>
	)
};

export const Tones: Story = {
	render: () => (
		<div className={gallery.row}>
			{tones.map((tone) => (
				<Panel key={tone} tone={tone}>
					<Panel.Header>
						<Text.Heading4>{tone}</Text.Heading4>
					</Panel.Header>
					<Panel.Body>
						<Text.Body2>Connected</Text.Body2>
					</Panel.Body>
				</Panel>
			))}
		</div>
	)
};
