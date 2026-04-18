<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import type { LayoutData } from './$types';
	import type { Subject } from '$lib/types';
	import type { User } from '@supabase/supabase-js';

	interface Props {
		data: LayoutData;
		children: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	// Pinned subjects passed from page data if available
	const pinnedSubjects: Subject[] = $derived(
		(data as Record<string, unknown>).pinnedSubjects as Subject[] ?? []
	);
	const user: User | null = $derived(
		((data as Record<string, unknown>).user as User | null) ?? null
	);
</script>

<div class="grid min-h-screen grid-cols-[220px_1fr]">
	<Sidebar {pinnedSubjects} {user} />
	<main class="overflow-hidden">
		{@render children()}
	</main>
</div>
