import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
	Button,
	UNSTABLE_Toast,
	UNSTABLE_ToastContent,
	UNSTABLE_ToastQueue,
	UNSTABLE_ToastRegion
} from 'react-aria-components';

import { Button as ActionButton } from '../button/button';
import { Icon } from '../icon/icon';
import { readMs } from '../lib/css-length';
import styles from './toast.module.css';

export type ToastTone = 'success' | 'critical' | 'neutral';

export type ToastAction = {
	label: string;
	onPress: () => void;
};

export type ToastOptions = {
	action?: ToastAction;
};

export type ToastTranslations = {
	regionLabel: string;
	dismiss: string;
};

type ToastContent = {
	tone: ToastTone;
	message: string;
	action?: ToastAction;
};

type ToastApi = {
	success: (message: string, options?: ToastOptions) => void;
	critical: (message: string, options?: ToastOptions) => void;
	neutral: (message: string, options?: ToastOptions) => void;
};

const ToastApiContext = createContext<ToastApi | null>(null);

export type ToastProviderProps = {
	translations: ToastTranslations;
	children: ReactNode;
};

export function ToastProvider({ translations, children }: ToastProviderProps) {
	const [queue] = useState(() => new UNSTABLE_ToastQueue<ToastContent>({ maxVisibleToasts: 4 }));
	const api = useMemo<ToastApi>(() => {
		function enqueue(tone: ToastTone, message: string, options?: ToastOptions) {
			queue.add({ tone, message, action: options?.action }, { timeout: readMs('--toast-dismiss') });
		}

		return {
			success: (message, options) => {
				enqueue('success', message, options);
			},
			critical: (message, options) => {
				enqueue('critical', message, options);
			},
			neutral: (message, options) => {
				enqueue('neutral', message, options);
			}
		};
	}, [queue]);

	return (
		<ToastApiContext.Provider value={api}>
			{children}
			<UNSTABLE_ToastRegion
				queue={queue}
				aria-label={translations.regionLabel}
				className={styles.region}
			>
				{({ toast }) => (
					<UNSTABLE_Toast toast={toast} className={styles.toast} data-tone={toast.content.tone}>
						<UNSTABLE_ToastContent className={styles.message}>
							{toast.content.message}
						</UNSTABLE_ToastContent>
						{toast.content.action ? (
							<ActionButton size="small" variant="secondary" onPress={toast.content.action.onPress}>
								{toast.content.action.label}
							</ActionButton>
						) : null}
						<Button slot="close" aria-label={translations.dismiss}>
							<Icon name="close" />
						</Button>
					</UNSTABLE_Toast>
				)}
			</UNSTABLE_ToastRegion>
		</ToastApiContext.Provider>
	);
}

export function useToast(): ToastApi {
	const api = useContext(ToastApiContext);

	if (api === null) {
		throw new Error('useToast must be used within ToastProvider');
	}

	return api;
}
