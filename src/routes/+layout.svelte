<script lang="ts">
	import { onMount } from 'svelte';
	import { configureWagmi, init } from '$lib/wagmi';

	let wagmiStarted = false;

	onMount(async () => {
		configureWagmi();
		wagmiStarted = true;
		await init();
	});
</script>

{#if wagmiStarted}
	<slot />
{/if}
