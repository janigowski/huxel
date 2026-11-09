<script lang="ts">
	import Home from '$lib/deck/Home.svelte';
	import { StudioHome } from '$lib/studio/home.svelte';

	const hue = new StudioHome();
</script>

<Home {hue} bridgeId="studio-hx01" preview />
