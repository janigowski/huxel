import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Text } from '../text/text';

const meta = {
	title: 'Foundations/Type',
	tags: ['autodocs']
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Specimen: Story = {
	render: () => (
		<div className={gallery.stack}>
			<Text.Heading1>Heading 1 leads a page</Text.Heading1>
			<Text.Heading2>Heading 2 leads a section</Text.Heading2>
			<Text.Heading3>Heading 3 names a group</Text.Heading3>
			<Text.Heading4>Heading 4 names a card</Text.Heading4>
			<Text.Heading5>Heading 5 names a compact row</Text.Heading5>
			<Text.Body1>Body 1 is the reading size for controls and paragraphs.</Text.Body1>
			<Text.Body2>Body 2 is the smallest size, used for meta and hints.</Text.Body2>
			<div className={gallery.label}>
				<Text.Body2>Technical label</Text.Body2>
			</div>
			<div className={gallery.mono}>
				<Text.Body2>bridge.lights[0].on</Text.Body2>
			</div>
		</div>
	)
};
