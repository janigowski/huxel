import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import type { Tone, Variant } from '../types';
import { Badge } from './badge';

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
	title: 'Status/Badge',
	component: Badge,
	tags: ['autodocs'],
	args: {
		children: 'Live'
	}
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
	render: () => (
		<div className={gallery.stack}>
			{variants.map((variant) => (
				<div key={variant} className={gallery.row}>
					{tones.map((tone) => (
						<Badge key={`${variant}-${tone}`} tone={tone} variant={variant}>
							{tone}
						</Badge>
					))}
				</div>
			))}
		</div>
	)
};
