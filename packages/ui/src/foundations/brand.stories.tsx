import type { Meta, StoryObj } from '@storybook/react-vite';

import { Mark, Wordmark } from '../brand/brand';
import gallery from '../stories/gallery.module.css';
import { Text } from '../text/text';

const meta = {
	title: 'Foundations/Brand',
	component: Wordmark,
	tags: ['autodocs']
} satisfies Meta<typeof Wordmark>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Identity: Story = {
	render: () => (
		<div className={gallery.stack}>
			<Wordmark />
			<Wordmark product="app" />
			<div className={gallery.row}>
				<Mark />
				<Text.Body1>
					Huxel names the product. The mark stands in when the wordmark does not fit.
				</Text.Body1>
			</div>
			<Text.Body2>The slash pair is emphasis color and hidden from the accessible name.</Text.Body2>
		</div>
	)
};
