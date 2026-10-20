import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { HueLinkButtonNotPressedError } from 'hue-sdk';
import { useRef, useState } from 'react';
import { describeError } from '../describe-error';
import { Footer } from './Footer';
import { Notice } from './Notice';
import { colors } from './theme';

interface LinkScreenProps {
	onLink: () => Promise<void>;
	notice?: string;
}

export function LinkScreen({ onLink, notice }: LinkScreenProps) {
	const [connecting, setConnecting] = useState(false);
	const [error, setError] = useState<string | null>(notice ?? null);
	const connectingRef = useRef(false);

	async function connect() {
		if (connectingRef.current) {
			return;
		}
		connectingRef.current = true;
		setConnecting(true);
		setError(null);
		try {
			await onLink();
		} catch (error) {
			setError(
				error instanceof HueLinkButtonNotPressedError
					? 'Press the link button on the bridge, then connect again.'
					: describeError(error)
			);
		} finally {
			connectingRef.current = false;
			setConnecting(false);
		}
	}

	useKeyboard((key) => {
		if (key.name === 'return' || key.name === 'linefeed') {
			void connect();
		}
	});

	return (
		<box flexDirection="column">
			<text fg={colors.text} attributes={TextAttributes.BOLD}>
				Bridge not linked
			</text>
			<text fg={colors.text}>
				Press the link button on your Hue bridge, then press Enter within 30 seconds.
			</text>
			{connecting ? <Notice tone="muted">Connecting…</Notice> : null}
			{error ? <Notice>{error}</Notice> : null}
			<Footer keys="enter connect · q quit" />
		</box>
	);
}
