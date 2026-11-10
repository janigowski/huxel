import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Text, Truncate } from './text';

const meta = {
	title: 'Text/Text',
	component: Text.Body1,
	tags: ['autodocs']
} satisfies Meta<typeof Text.Body1>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Specimen: Story = {
	args: {
		children: 'Heading 1'
	},
	render: () => (
		<div className={gallery.stack}>
			<Text.Heading1>Heading 1</Text.Heading1>
			<Text.Heading2>Heading 2</Text.Heading2>
			<Text.Heading3>Heading 3</Text.Heading3>
			<Text.Heading4>Heading 4</Text.Heading4>
			<Text.Heading5>Heading 5</Text.Heading5>
			<Text.Body1>Body 1 keeps the reading size for product UI.</Text.Body1>
			<Text.Body2>Body 2 is the smallest text, still at 12px.</Text.Body2>
		</div>
	)
};

export const Truncated: Story = {
	args: {
		children: 'A long room name that does not fit in the lane'
	},
	render: () => (
		<div className={gallery.narrow}>
			<Truncate>A long room name that does not fit in the lane</Truncate>
		</div>
	)
};
