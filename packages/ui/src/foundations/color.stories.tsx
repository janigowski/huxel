import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../text/text';
import gallery from '../stories/gallery.module.css';

const ramps = [
	['neutral', 'Ink, chrome, and page surfaces'],
	['brand', 'Emphasis and brand moments'],
	['critical', 'Destructive and error states'],
	['warning', 'Caution that needs attention'],
	['success', 'Confirmation and completion'],
	['featured', 'Highlighted content'],
	['insight', 'Intelligent accents and the spark']
] as const;

const steps = [
	'100',
	'200',
	'300',
	'400',
	'500',
	'600',
	'700',
	'800',
	'900',
	'1000',
	'1100',
	'1200'
] as const;

const stepUse: Record<(typeof steps)[number], string> = {
	'100': 'Lightest tint, for text on strong fills',
	'200': 'Primary light text on dark surfaces',
	'300': 'Soft highlight',
	'400': 'Readable accent',
	'500': 'Default accent',
	'600': 'Pressed accent',
	'700': 'Strong fill',
	'800': 'Deep fill',
	'900': 'Disabled border neighbor',
	'1000': 'Raised surface',
	'1100': 'Quiet surface',
	'1200': 'Page canvas'
};

const semanticEntries = [
	['--background-default', 'Page canvas'],
	['--background-hover', 'Hovered page surface'],
	['--background-pressed', 'Pressed page surface'],
	['--background-selected', 'Selected page surface'],
	['--background-invalid', 'Invalid field fill'],
	['--background-disabled', 'Disabled surface'],
	['--foreground-neutral-primary', 'Default text'],
	['--foreground-neutral-secondary', 'Supporting text'],
	['--foreground-neutral-tertiary', 'Placeholder text'],
	['--foreground-emphasis-primary', 'Emphasis text and links'],
	['--foreground-critical-primary', 'Error text'],
	['--foreground-warning-primary', 'Warning text'],
	['--foreground-success-primary', 'Success text'],
	['--foreground-featured-primary', 'Featured text'],
	['--foreground-inverted-primary', 'Text on an inverted fill'],
	['--background-neutral-strong', 'Neutral strong fill'],
	['--background-emphasis-strong', 'Emphasis strong fill'],
	['--background-critical-strong', 'Critical strong fill'],
	['--background-warning-strong', 'Warning strong fill'],
	['--background-success-strong', 'Success strong fill'],
	['--background-featured-strong', 'Featured strong fill'],
	['--background-inverted-strong', 'Inverted strong fill'],
	['--border-neutral', 'Neutral border'],
	['--border-emphasis', 'Emphasis border'],
	['--border-critical', 'Critical border'],
	['--focus-border', 'Keyboard focus ring'],
	['--intelligent-ring', 'Intelligent fill, not a flat color']
] as const;

const semantic = semanticEntries.map(([name, purpose]) => ({ name, purpose }));

function Swatch({ token, purpose }: { token: string; purpose: string }) {
	return (
		<div className={gallery.swatch} style={{ background: `var(${token})` }}>
			<Text.Body2>{token}</Text.Body2>
			<Text.Body2>{purpose}</Text.Body2>
		</div>
	);
}

const meta = {
	title: 'Foundations/Color',
	tags: ['autodocs']
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ramps: Story = {
	render: () => (
		<div className={gallery.stack}>
			{ramps.map(([name, purpose]) => (
				<div key={name} className={gallery.stack}>
					<Text.Heading3>{name}</Text.Heading3>
					<Text.Body2>{purpose}</Text.Body2>
					<div className={gallery.row}>
						{steps.map((step) => (
							<Swatch key={step} token={`--color-${name}-${step}`} purpose={stepUse[step]} />
						))}
					</div>
				</div>
			))}
		</div>
	)
};

export const Semantic: Story = {
	render: () => (
		<div className={gallery.row}>
			{semantic.map((item) => (
				<Swatch key={item.name} token={item.name} purpose={item.purpose} />
			))}
		</div>
	)
};
