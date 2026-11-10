import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { ButtonGroup, ButtonGroupItem } from './button-group';

const meta = {
	title: 'Actions/ButtonGroup',
	component: ButtonGroup,
	tags: ['autodocs'],
	args: {
		label: 'Alignment',
		selection: 'single',
		children: null
	}
} satisfies Meta<typeof ButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {
	render: () => (
		<div className={gallery.row}>
			<ButtonGroup label="Alignment" selection="single">
				<ButtonGroupItem id="left">Left</ButtonGroupItem>
				<ButtonGroupItem id="center">Center</ButtonGroupItem>
				<ButtonGroupItem id="right">Right</ButtonGroupItem>
			</ButtonGroup>
		</div>
	)
};

export const Multiple: Story = {
	render: () => (
		<ButtonGroup label="Days" selection="multiple">
			<ButtonGroupItem id="mon">Mon</ButtonGroupItem>
			<ButtonGroupItem id="tue">Tue</ButtonGroupItem>
			<ButtonGroupItem id="wed">Wed</ButtonGroupItem>
		</ButtonGroup>
	)
};
