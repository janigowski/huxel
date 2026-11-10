import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Text } from '../text/text';
import { ScrollArea } from './scroll-area';

const meta = {
	title: 'Layout/ScrollArea',
	component: ScrollArea,
	tags: ['autodocs'],
	args: {
		children: null
	}
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	render: () => (
		<ScrollArea className={gallery.viewport}>
			<div>
				{Array.from({ length: 12 }, (_, index) => (
					<Text.Body1 key={index}>Row {index + 1}</Text.Body1>
				))}
			</div>
		</ScrollArea>
	)
};
