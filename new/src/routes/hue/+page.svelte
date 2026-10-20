<script lang="ts">
	import { createHueClient, registerApplication, type LightGet } from 'hue-sdk';

	const baseUrl = `${location.origin}/bridge`;

	let appKey = $state(localStorage.getItem('hue-app-key') ?? '');
	let lights = $state<LightGet[]>([]);
	let status = $state('');

	const hue = $derived(createHueClient({ baseUrl, appKey }));

	async function run(label: string, action: () => Promise<void>) {
		status = `${label}...`;
		try {
			await action();
			status = `${label}: ok`;
		} catch (error) {
			console.error(error);
			status = `${label}: ${error instanceof Error ? `${error.name} - ${error.message}` : error}`;
		}
	}

	function register() {
		return run('Register', async () => {
			const credentials = await registerApplication({
				baseUrl,
				applicationName: 'hue-sdk-test',
				deviceName: 'browser'
			});
			appKey = credentials.username;
			localStorage.setItem('hue-app-key', appKey);
		});
	}

	function loadLights() {
		return run('List lights', async () => {
			const response = await hue.lights.list();
			lights = response.data;
		});
	}

	function toggle(light: LightGet) {
		return run(`Toggle ${light.metadata.name}`, async () => {
			await hue.lights.update(light.id, { on: { on: !light.on.on } });
			light.on.on = !light.on.on;
		});
	}
</script>

<h1>hue-sdk test</h1>

<p>
	<button onclick={register}>Register (press link button first)</button>
	<input bind:value={appKey} placeholder="app key" />
	<button onclick={loadLights} disabled={!appKey}>List lights</button>
</p>

<p>{status}</p>

<ul>
	{#each lights as light (light.id)}
		<li>
			<button onclick={() => toggle(light)}>{light.on.on ? 'ON' : 'OFF'}</button>
			{light.metadata.name}
		</li>
	{/each}
</ul>
