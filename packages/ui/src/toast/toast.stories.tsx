import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button/button';
import gallery from '../stories/gallery.module.css';
import { useToast } from './toast';

function Demo() {
	const toast = useToast();

	return (
		<div className={gallery.row}>
			<Button
				tone="success"
				onPress={() => {
					toast.success('Saved');
				}}
			>
				Success
			</Button>
			<Button
				tone="critical"
				onPress={() => {
					toast.critical('Failed', { action: { label: 'Retry', onPress: () => undefined } });
				}}
			>
				Critical
			</Button>
			<Button
				variant="secondary"
				onPress={() => {
					toast.neutral('Note');
				}}
			>
				Neutral
			</Button>
		</div>
	);
}

const meta = {
	title: 'Feedback/Toast',
	component: Demo,
	tags: ['autodocs']
} satisfies Meta<typeof Demo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
