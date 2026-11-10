import type { Meta, StoryObj } from '@storybook/react-vite';

import { Radio, RadioGroup } from './radio-group';

const meta = {
	title: 'Form/RadioGroup',
	component: RadioGroup,
	tags: ['autodocs'],
	args: {
		label: 'Mode',
		children: null
	}
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	render: (args) => (
		<RadioGroup label={args.label ?? 'Mode'} disabled={args.disabled} defaultValue="auto">
			<Radio value="auto">Auto</Radio>
			<Radio value="manual">Manual</Radio>
		</RadioGroup>
	)
};

export const Disabled: Story = {
	args: {
		disabled: true
	},
	render: (args) => (
		<RadioGroup label={args.label ?? 'Mode'} disabled={args.disabled} defaultValue="auto">
			<Radio value="auto">Auto</Radio>
			<Radio value="manual">Manual</Radio>
		</RadioGroup>
	)
};
