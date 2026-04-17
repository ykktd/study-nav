<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import type { LayoutData } from './$types';
	import type { Subject } from '$lib/types';

	interface Props {
		data: LayoutData;
		children: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	// Pinned subjects passed from page data if available
	const pinnedSubjects: Subject[] = $derived(
		(data as Record<string, unknown>).pinnedSubjects as Subject[] ?? []
	);
	const term: string = $derived(
		((data as Record<string, unknown>).term as string) ?? '2026 春学期'
	);
</script>

<div class="app">
	<Sidebar {pinnedSubjects} {term} />
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: grid;
		grid-template-columns: 220px 1fr;
		min-height: 100vh;
	}
	main {
		min-height: 100vh;
		overflow: hidden;
	}
</style>
