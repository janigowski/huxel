import { TextAttributes } from '@opentui/core';
import { colors } from './theme';

interface HeaderProps {
	bridgeId: string | undefined;
}

export function Header({ bridgeId }: HeaderProps) {
	return (
		<box flexDirection="column" marginBottom={1} flexShrink={0}>
			<text fg={colors.accent} attributes={TextAttributes.BOLD}>
				Hue Remote
			</text>
			<text fg={colors.muted}>{bridgeId ? `Bridge ${bridgeId}` : 'Looking for bridge…'}</text>
		</box>
	);
}
