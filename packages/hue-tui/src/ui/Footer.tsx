import { colors } from './theme';

interface FooterProps {
	keys: string;
}

export function Footer({ keys }: FooterProps) {
	return (
		<box marginTop={1} flexShrink={0}>
			<text fg={colors.muted}>{keys}</text>
		</box>
	);
}
