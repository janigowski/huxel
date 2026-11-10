import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from '../icon/icon';
import gallery from '../stories/gallery.module.css';
import { Text } from '../text/text';
import type { Tone, Variant } from '../types';
import { Button } from './button';

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
const sizes = ['xsmall', 'small', 'medium', 'large', 'xlarge'] as const;

const meta = {
	title: 'Actions/Button',
	component: Button,
	tags: ['autodocs']
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	args: {
		children: 'Save'
	}
};

export const Tones: Story = {
	render: () => (
		<div className={gallery.stack}>
			{variants.map((variant) => (
				<div key={variant} className={gallery.row}>
					{tones.map((tone) => (
						<Button key={`${variant}-${tone}`} tone={tone} variant={variant}>
							{tone}
						</Button>
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
				<Button key={size} size={size}>
					{size}
				</Button>
			))}
		</div>
	)
};

export const Loading: Story = {
	args: {
		loading: true,
		children: 'Saving'
	}
};

export const Disabled: Story = {
	args: {
		disabled: true,
		children: 'Save'
	}
};

export const WithIcon: Story = {
	render: () => (
		<Button tone="emphasis">
			<Icon name="plus" />
			Add light
		</Button>
	)
};

export const AsChild: Story = {
	render: () => (
		<div className={gallery.stack}>
			<Text.Body2>The same paint sits on a link.</Text.Body2>
			<Button asChild tone="emphasis">
				<a href="https://example.com">Docs</a>
			</Button>
		</div>
	)
};
