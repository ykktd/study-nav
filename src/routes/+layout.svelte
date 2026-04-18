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

<div class="grid min-h-screen grid-cols-[220px_1fr]">
	<Sidebar {pinnedSubjects} {term} />
	<main class="overflow-hidden">
		{@render children()}
	</main>
</div>
