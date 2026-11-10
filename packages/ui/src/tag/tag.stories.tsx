import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import type { Tone, Variant } from '../types';
import { Tag } from './tag';

const tones: Tone[] = [
	'base',
	'neutral',
	'neutral-inverted',
	'emphasis',
	'featured',
	'critical',
	'warning',
	'success',
	'intelligent'
];
const variants: Variant[] = ['primary', 'secondary', 'tertiary'];

const meta = {
	title: 'Status/Tag',
	component: Tag,
	tags: ['autodocs'],
	args: {
		children: 'Kitchen'
	}
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
	render: () => (
		<div className={gallery.stack}>
			{variants.map((variant) => (
				<div key={variant} className={gallery.row}>
					{tones.map((tone) => (
						<Tag key={`${variant}-${tone}`} tone={tone} variant={variant}>
							{tone}
						</Tag>
					))}
				</div>
			))}
		</div>
	)
};

export const States: Story = {
	render: () => (
		<div className={gallery.row}>
			<Tag icon="check">Ready</Tag>
			<Tag loading>Syncing</Tag>
			<Tag asChild tone="emphasis">
				<a href="/rooms">Rooms</a>
			</Tag>
		</div>
	)
};
