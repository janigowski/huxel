import { TextAttributes } from '@opentui/core';
import { colors } from './theme';

interface NoticeProps {
	tone?: 'error' | 'muted';
	children: string;
}

export function Notice({ tone = 'error', children }: NoticeProps) {
	return tone === 'error' ? (
		<text fg={colors.accent} attributes={TextAttributes.BOLD} flexShrink={0}>
			! {children}
		</text>
	) : (
		<text fg={colors.muted} flexShrink={0}>
			{children}
		</text>
	);
}
