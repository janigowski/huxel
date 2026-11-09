import { TextAttributes } from '@opentui/core';
import { colors } from './theme';

interface HeaderProps {
	bridgeId: string | undefined;
}

export function Header({ bridgeId }: HeaderProps) {
	return (
		<box flexDirection="column" marginBottom={1} flexShrink={0}>
			<box flexDirection="row">
				<text fg={colors.text} attributes={TextAttributes.BOLD}>
					huxel
				</text>
				<text fg={colors.accent} attributes={TextAttributes.BOLD}>
					//
				</text>
				<text fg={colors.text} attributes={TextAttributes.BOLD}>
					tui
				</text>
			</box>
			<text fg={colors.muted}>{bridgeId ? `Bridge ${bridgeId}` : 'Looking for bridge…'}</text>
		</box>
	);
}
