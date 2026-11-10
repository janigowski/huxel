import type { Preview } from '@storybook/react-vite';
import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@huxel/tokens/tokens.css';

import { IconSprite } from '../src/icon/icon';
import { ToastProvider } from '../src/toast/toast';
import './preview.css';

const preview: Preview = {
	parameters: {
		backgrounds: {
			disabled: true
		},
		options: {
			storySort: {
				order: [
					'Foundations',
					'Brand',
					'Actions',
					'Text',
					'Form',
					'Status',
					'Identity',
					'Feedback',
					'Overlays',
					'Disclosure',
					'Layout',
					'Data'
				]
			}
		}
	},
	decorators: [
		(Story) => (
			<ToastProvider translations={{ regionLabel: 'Notifications', dismiss: 'Dismiss' }}>
				<IconSprite />
				<Story />
			</ToastProvider>
		)
	]
};

export default preview;
