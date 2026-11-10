import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import type { Tone, Variant } from '../types';
import { IconButton } from './icon-button';

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
const sizes = ['xsmall', 'small', 'medium', 'large'] as const;

const meta = {
	title: 'Actions/IconButton',
	component: IconButton,
	tags: ['autodocs'],
	args: {
		icon: 'plus',
		label: 'Add light'
	}
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
	render: () => (
		<div className={gallery.stack}>
			{variants.map((variant) => (
				<div key={variant} className={gallery.row}>
					{tones.map((tone) => (
						<IconButton
							key={`${variant}-${tone}`}
							icon="plus"
							label={`${tone} ${variant}`}
							tone={tone}
							variant={variant}
						/>
					))}
				</div>
			))}
		</div>
	)
};

export const Sizes: Story = {
	render: () => (
		<div className={gallery.row}>
			{sizes.map((size) => (
				<IconButton key={size} icon="search" label={size} size={size} />
			))}
		</div>
	)
};

export const Loading: Story = {
	args: {
		loading: true
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
