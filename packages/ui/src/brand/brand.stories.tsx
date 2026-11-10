import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Text } from '../text/text';
import { Mark, Wordmark } from './brand';

const meta = {
	title: 'Brand/Brand',
	component: Wordmark,
	tags: ['autodocs']
} satisfies Meta<typeof Wordmark>;

export default meta;

type Story = StoryObj<typeof meta>;

const products = ['client', 'app', 'tui', 'extension', 'mcp'] as const;

export const Wordmarks: Story = {
	render: () => (
		<div className={gallery.stack}>
			<Wordmark />
			{products.map((product) => (
				<Wordmark key={product} product={product} />
			))}
		</div>
	)
};

export const Marks: Story = {
	render: () => (
		<div className={gallery.row}>
			<Mark />
			<Text.Body2>The mark is decorative unless it receives a label.</Text.Body2>
		</div>
	)
};
