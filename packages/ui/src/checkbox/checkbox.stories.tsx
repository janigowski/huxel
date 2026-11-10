import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Checkbox } from './checkbox';

const meta = {
	title: 'Form/Checkbox',
	component: Checkbox,
	tags: ['autodocs'],
	args: {
		children: 'Remember bridge'
	}
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
	render: () => (
		<div className={gallery.stack}>
			<Checkbox>Off</Checkbox>
			<Checkbox defaultSelected>On</Checkbox>
			<Checkbox disabled>Disabled</Checkbox>
		</div>
	)
};
