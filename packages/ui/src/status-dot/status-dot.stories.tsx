import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { StatusDot } from './status-dot';

const tones = ['critical', 'warning', 'success', 'neutral', 'emphasis'] as const;

const meta = {
	title: 'Feedback/StatusDot',
	component: StatusDot,
	tags: ['autodocs'],
	args: {
		children: 'Online',
		tone: 'success'
	}
} satisfies Meta<typeof StatusDot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
	render: () => (
		<div className={gallery.stack}>
			{tones.map((tone) => (
				<StatusDot key={tone} tone={tone}>
					{tone}
				</StatusDot>
			))}
			<span data-corner="critical">Corner</span>
		</div>
	)
};
