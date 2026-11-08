import '../app.css';
import { mount } from 'svelte';
import App from '../App.svelte';
import { createChromeHostAccess } from '../adapters/chrome-host-access';
import { createChromeStorage } from '../adapters/chrome-storage';
import { createHueBridgeDependencies } from '../adapters/hue-bridge';
import { BridgeSession } from '../session/bridge-session.svelte';

const session = new BridgeSession({
	storage: createChromeStorage(),
	hostAccess: createChromeHostAccess(),
	...createHueBridgeDependencies()
});

void session.restore();

mount(App, { target: document.body, props: { session } });
