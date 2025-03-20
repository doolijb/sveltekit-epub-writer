<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import '../app.css'
	let {
			data, 
			children
		}: {
			data: {isDev: boolean},
			children: Snippet
		} = $props()

	if (data.isDev) {
		
	}
</script>

{@render children()}


<style lang="postcss">
</style>