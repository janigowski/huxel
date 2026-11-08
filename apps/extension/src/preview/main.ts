import '../app.css';
import './preview.css';
import { mount } from 'svelte';
import App from '../App.svelte';
import { BridgeSession } from '../session/bridge-session.svelte';
import { createPreviewDependencies } from './preview-dependencies';

const session = new BridgeSession(createPreviewDependencies());

void session.restore();

mount(App, { target: document.body, props: { session } });
