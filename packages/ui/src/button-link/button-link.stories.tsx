import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import type { ButtonSize, ButtonTone } from '../button/button';
import type { Variant } from '../types';
import { ButtonLink } from './button-link';

const tones: ButtonTone[] = [
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
const sizes: ButtonSize[] = ['xsmall', 'small', 'medium', 'large', 'xlarge'];

const meta = {
	title: 'Actions/ButtonLink',
	component: ButtonLink,
	tags: ['autodocs'],
	args: {
		href: '/rooms',
		children: 'Rooms'
	}
} satisfies Meta<typeof ButtonLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
	render: () => (
		<div className={gallery.row}>
			{sizes.map((size) => (
				<ButtonLink key={size} href="/rooms" size={size}>
					{size}
				</ButtonLink>
			))}
		</div>
	)
};

export const Tones: Story = {
	render: () => (
		<div className={gallery.stack}>
			{variants.map((variant) => (
				<div key={variant} className={gallery.row}>
					{tones.map((tone) => (
						<ButtonLink key={`${variant}-${tone}`} href="/rooms" tone={tone} variant={variant}>
							{tone}
						</ButtonLink>
					))}
				</div>
			))}
		</div>
	)
};
