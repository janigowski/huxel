import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Field } from './field';

const meta = {
	title: 'Form/Field',
	component: Field,
	tags: ['autodocs']
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: 'Name',
		children: <input placeholder="Kitchen" />
	}
};

export const Messages: Story = {
	args: {
		label: 'Name',
		children: <input />
	},
	render: () => (
		<div className={gallery.stack}>
			<Field
				label="Name"
				hint="Shown while the field is focused"
				error="Required"
				warning="Too short"
			>
				<input />
			</Field>
			<Field label="Room" warning="Check the spelling" chrome="ghost">
				<input />
			</Field>
			<Field label="Note" info="Visible alongside the field" onClear={() => undefined}>
				<input defaultValue="Hall" />
			</Field>
		</div>
	)
};
