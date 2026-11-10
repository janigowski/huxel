import type { Meta, StoryObj } from '@storybook/react-vite';

import gallery from '../stories/gallery.module.css';
import { Text } from '../text/text';

const radii = [
	['--radius-2', 'Fine edges on checks'],
	['--radius-4', 'Controls'],
	['--radius-8', 'Cards and menus'],
	['--radius-12', 'Dialogs'],
	['--radius-16', 'Sheets'],
	['--radius-24', 'Large containers'],
	['--radius-full', 'Pills and avatars'],
	['--radius-control', 'The shared control radius']
] as const;

const spaces = [
	['--space-1', 'Tight gaps inside a control'],
	['--space-2', 'Icon gaps and compact padding'],
	['--space-3', 'Gaps between items in a row'],
	['--space-4', 'Padding inside cards and overlays'],
	['--space-6', 'Padding for a page section'],
	['--space-8', 'Gaps between major groups'],
	['--space-12', 'The step between group gaps and a page inset'],
	['--space-16', 'The deepest page inset']
] as const;

const controlSizes = [
	['--size-xsmall', 'Badges and the smallest buttons'],
	['--size-small', 'Tags and small buttons'],
	['--size-medium', 'The default control height'],
	['--size-large', 'Large buttons and wide table controls'],
	['--size-xlarge', 'The largest control height']
] as const;

const elevations = [
	['--elevation-1', 'Buttons and cards'],
	['--elevation-2', 'Tooltips'],
	['--elevation-3', 'Menus and popovers'],
	['--elevation-4', 'Dialogs and drawers'],
	['--elevation-5', 'The highest overlay'],
	['--elevation-stack', 'Stacked rows'],
	['--elevation-sticky', 'Sticky headers']
] as const;

const meta = {
	title: 'Foundations/Scale',
	tags: ['autodocs']
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Space: Story = {
	render: () => (
		<div className={gallery.stack}>
			{spaces.map(([token, purpose]) => (
				<div key={token} className={gallery.row}>
					<div
						className={gallery.sample}
						style={{ width: `var(${token})`, height: 'var(--space-4)' }}
					/>
					<Text.Body2>{token}</Text.Body2>
					<Text.Body2>{purpose}</Text.Body2>
				</div>
			))}
		</div>
	)
};

export const ControlSize: Story = {
	render: () => (
		<div className={gallery.row}>
			{controlSizes.map(([token, purpose]) => (
				<div key={token} className={gallery.stack}>
					<div className={gallery.sample} style={{ height: `var(${token})` }} />
					<Text.Body2>{token}</Text.Body2>
					<Text.Body2>{purpose}</Text.Body2>
				</div>
			))}
		</div>
	)
};

export const Radius: Story = {
	render: () => (
		<div className={gallery.row}>
			{radii.map(([token, purpose]) => (
				<div key={token} className={gallery.stack}>
					<div className={gallery.sample} style={{ borderRadius: `var(${token})` }} />
					<Text.Body2>{token}</Text.Body2>
					<Text.Body2>{purpose}</Text.Body2>
				</div>
			))}
		</div>
	)
};

export const Elevation: Story = {
	render: () => (
		<div className={gallery.row}>
			{elevations.map(([token, purpose]) => (
				<div key={token} className={gallery.stack}>
					<div className={gallery.sample} style={{ boxShadow: `var(${token})` }} />
					<Text.Body2>{token}</Text.Body2>
					<Text.Body2>{purpose}</Text.Body2>
				</div>
			))}
			<div className={gallery.stack}>
				<div className={gallery.sample} />
				<Text.Body2>Disabled</Text.Body2>
				<Text.Body2>Disabled surfaces drop their shadow.</Text.Body2>
			</div>
		</div>
	)
};

export const Motion: Story = {
	render: () => (
		<div className={gallery.stack}>
			<Text.Body2>
				Hover a sample. Duration samples use --ease-default, the easing for color and small moves.
			</Text.Body2>
			<div className={gallery.row}>
				<div className={gallery.stack}>
					<div className={`${gallery.motion} ${gallery.short}`} />
					<Text.Body2>--duration-short</Text.Body2>
					<Text.Body2>Quick feedback such as hover color.</Text.Body2>
				</div>
				<div className={gallery.stack}>
					<div className={`${gallery.motion} ${gallery.defaultDuration}`} />
					<Text.Body2>--duration-default</Text.Body2>
					<Text.Body2>Most control transitions.</Text.Body2>
				</div>
				<div className={gallery.stack}>
					<div className={`${gallery.motion} ${gallery.long}`} />
					<Text.Body2>--duration-long</Text.Body2>
					<Text.Body2>Overlays entering and leaving.</Text.Body2>
				</div>
				<div className={gallery.stack}>
					<div className={`${gallery.motion} ${gallery.defaultDuration} ${gallery.emphasis}`} />
					<Text.Body2>--ease-emphasis</Text.Body2>
					<Text.Body2>Larger moves, such as a sheet.</Text.Body2>
				</div>
			</div>
			<div className={gallery.stack}>
				<Text.Body2>--toast-dismiss</Text.Body2>
				<Text.Body2>How long a toast stays before it dismisses.</Text.Body2>
			</div>
		</div>
	)
};
