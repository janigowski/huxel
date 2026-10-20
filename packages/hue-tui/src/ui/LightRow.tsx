import { TextAttributes } from '@opentui/core';
import type { ReactLight } from 'hue-app/react';
import { memo } from 'react';
import { colors } from './theme';

const BAR_WIDTH = 10;

interface LightRowProps {
	light: ReactLight;
	index: number;
	selected: boolean;
	nameWidth: number;
}

export const LightRow = memo(function LightRow({
	light,
	index,
	selected,
	nameWidth
}: LightRowProps) {
	const number = String(index + 1).padStart(2, '0');
	const level = light.isOn ? Math.round(light.brightness ?? 100) : 0;
	const filled = Math.round((level * BAR_WIDTH) / 100);
	const tone = light.isOn ? colors.accent : colors.muted;

	return (
		<text flexShrink={0} attributes={selected ? TextAttributes.BOLD : TextAttributes.NONE}>
			<span fg={colors.accent}>{selected ? '›' : ' '}</span>
			<span fg={colors.muted}> {number} </span>
			<span fg={tone}>{light.isOn ? '●' : '○'} </span>
			<span fg={selected ? colors.accent : colors.text}>{light.name.padEnd(nameWidth)} </span>
			<span fg={tone}>{`${level}%`.padStart(4)} </span>
			{light.brightness === null ? null : (
				<span fg={tone}>{'█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)}</span>
			)}
		</text>
	);
});
