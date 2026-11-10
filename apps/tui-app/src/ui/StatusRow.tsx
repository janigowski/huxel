import { TextAttributes } from '@opentui/core';
import { memo } from 'react';
import { colors } from './theme';

const BAR_WIDTH = 10;

interface StatusRowProps {
	name: string;
	index: number;
	selected: boolean;
	nameWidth: number;
	isOn: boolean;
	brightness: number | null;
	detail?: string;
}

export const StatusRow = memo(function StatusRow({
	name,
	index,
	selected,
	nameWidth,
	isOn,
	brightness,
	detail
}: StatusRowProps) {
	const number = String(index + 1).padStart(2, '0');
	const level = isOn ? Math.round(brightness ?? 100) : 0;
	const filled = Math.round((level * BAR_WIDTH) / 100);
	const tone = isOn ? colors.accent : colors.muted;

	return (
		<text
			flexShrink={0}
			wrapMode="none"
			attributes={selected ? TextAttributes.BOLD : TextAttributes.NONE}
		>
			<span fg={colors.accent}>{selected ? '›' : ' '}</span>
			<span fg={colors.faint}> {number} </span>
			<span fg={tone}>{isOn ? '●' : '○'} </span>
			<span fg={selected || isOn ? colors.text : colors.muted}>{name.padEnd(nameWidth)} </span>
			<span fg={tone}>{`${level}%`.padStart(4)} </span>
			{brightness === null ? null : (
				<span fg={tone}>{'█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)}</span>
			)}
			{detail ? <span fg={colors.muted}> {detail}</span> : null}
		</text>
	);
});
