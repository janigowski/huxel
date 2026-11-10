import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Text } from '../text/text';
import { Card, type CardTone } from './card';

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
	title: 'Layout/Card',
	component: Card,
	tags: ['autodocs'],
	args: {
		children: null
	}
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	render: (args) => (
		<div className={gallery.row}>
			<Card tone={args.tone}>
				<Card.Header>
					<Text.Heading4>Kitchen</Text.Heading4>
				</Card.Header>
				<Card.Body>
					<Text.Body2>4 lights</Text.Body2>
				</Card.Body>
			</Card>
			<Card asChild tone="emphasis">
				<a href="/rooms/kitchen">
					<Card.Header>
						<Text.Heading4>Open kitchen</Text.Heading4>
					</Card.Header>
				</a>
			</Card>
		</div>
	)
};

export const Tones: Story = {
	render: () => (
		<div className={gallery.row}>
			{tones.map((tone) => (
				<Card key={tone} tone={tone}>
					<Card.Header>
						<Text.Heading4>{tone}</Text.Heading4>
					</Card.Header>
					<Card.Body>
						<Text.Body2>4 lights</Text.Body2>
					</Card.Body>
				</Card>
			))}
		</div>
	)
};
