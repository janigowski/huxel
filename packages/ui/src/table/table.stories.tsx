import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../text/text';
import { Table } from './table';

type Room = {
	id: string;
	name: string;
	lights: number;
};

const rows: Room[] = Array.from({ length: 40 }, (_, index) => ({
	id: `room-${index + 1}`,
	name: `Room ${index + 1}`,
	lights: (index % 6) + 1
}));

const meta = {
	title: 'Data/Table',
	component: Table<Room>,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'Focus a column resizer and press Arrow Left or Arrow Right to change its width.'
			}
		}
	}
} satisfies Meta<typeof Table<Room>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	args: {
		label: 'Rooms',
		rows,
		getRowId: (row) => row.id,
		loading: false,
		columns: [
			{
				id: 'name',
				header: 'Name',
				width: 220,
				sortable: true,
				pinnable: true,
				sortValue: (row) => row.name,
				cell: (row) => <Text.Body2>{row.name}</Text.Body2>
			},
			{
				id: 'lights',
				header: 'Lights',
				width: 120,
				sortable: true,
				sortValue: (row) => row.lights,
				cell: (row) => <Text.Body2>{String(row.lights)}</Text.Body2>
			}
		],
		translations: {
			selectAll: 'Select all rooms',
			selectRow: 'Select room',
			sortAscending: 'Sort ascending',
			sortDescending: 'Sort descending',
			loading: 'Loading rooms',
			empty: 'No rooms',
			pin: 'Pin column',
			unpin: 'Unpin column',
			resize: 'Resize column'
		}
	}
};

export const LoadingPage: Story = {
	args: {
		...Playground.args,
		loading: 'page'
	}
};

export const LoadingMore: Story = {
	args: {
		...Playground.args,
		loading: 'more'
	}
};

export const Empty: Story = {
	args: {
		...Playground.args,
		rows: [],
		empty: <Text.Body2>Add a room to see it here.</Text.Body2>
	}
};
