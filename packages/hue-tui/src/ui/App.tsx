import { useKeyboard } from '@opentui/react';
import type { HueApp } from 'hue-app';
import { HueForbiddenError, HueUnauthorizedError } from 'hue-sdk';
import { useEffect, useState } from 'react';
import type { BridgeAddress } from '../config/config-store';
import type { Connection } from '../connection';
import { describeError } from '../describe-error';
import { Footer } from './Footer';
import { Header } from './Header';
import { LightsScreen } from './LightsScreen';
import { LinkScreen } from './LinkScreen';
import { Notice } from './Notice';
import { colors } from './theme';

const KEY_REJECTED = 'The bridge rejected the saved app key. Link the bridge again.';

type Screen =
	| { kind: 'resolving' }
	| { kind: 'failed'; message: string }
	| { kind: 'link'; bridge: BridgeAddress; notice?: string }
	| { kind: 'lights'; bridge: BridgeAddress; app: HueApp };

interface AppProps {
	connection: Connection;
	onQuit: () => void;
}

export function App({ connection, onQuit }: AppProps) {
	const [screen, setScreen] = useState<Screen>({ kind: 'resolving' });

	useEffect(() => {
		let active = true;
		connection
			.resolve()
			.then(({ bridge, appKey }) => {
				const next: Screen = appKey
					? { kind: 'lights', bridge, app: connection.open(bridge, appKey) }
					: { kind: 'link', bridge };
				if (active) {
					setScreen(next);
				}
			})
			.catch((error: unknown) => {
				if (active) {
					setScreen({ kind: 'failed', message: describeError(error) });
				}
			});
		return () => {
			active = false;
		};
	}, [connection]);

	useKeyboard((key) => {
		if (key.name === 'q' || key.name === 'escape' || (key.ctrl && key.name === 'c')) {
			onQuit();
		}
	});

	async function link(bridge: BridgeAddress) {
		const appKey = await connection.link(bridge);
		setScreen({ kind: 'lights', bridge, app: connection.open(bridge, appKey) });
	}

	function initializeFailed(bridge: BridgeAddress, error: unknown) {
		if (error instanceof HueUnauthorizedError || error instanceof HueForbiddenError) {
			setScreen({ kind: 'link', bridge, notice: KEY_REJECTED });
		}
	}

	return (
		<box flexDirection="column" padding={1} backgroundColor={colors.background} flexGrow={1}>
			<Header bridgeId={'bridge' in screen ? screen.bridge.id : undefined} />
			{screen.kind === 'failed' ? (
				<>
					<Notice>{screen.message}</Notice>
					<Footer keys="q quit" />
				</>
			) : null}
			{screen.kind === 'link' ? (
				<LinkScreen onLink={() => link(screen.bridge)} notice={screen.notice} />
			) : null}
			{screen.kind === 'lights' ? (
				<LightsScreen
					app={screen.app}
					onError={(error) => initializeFailed(screen.bridge, error)}
				/>
			) : null}
		</box>
	);
}
