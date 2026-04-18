<script lang="ts">
	import { page } from '$app/state';
	import type { Subject } from '$lib/types';

	interface Props {
		pinnedSubjects?: Subject[];
		term?: string;
	}

	let { pinnedSubjects = [], term = '2026 春学期' }: Props = $props();

	const currentPath = $derived(page.url.pathname);

	function isActive(path: string): boolean {
		return currentPath === path;
	}
</script>

<aside class="sticky top-0 flex h-screen flex-col gap-7 border-r border-hairline-soft bg-linear-to-b from-bg to-bg-deep px-4.5 py-5.5">
	<div class="flex items-center gap-2.5 px-1.5 py-1">
		<div
			class="size-6.5 shrink-0 rounded-[7px]"
			aria-hidden="true"
			style="background: conic-gradient(from 210deg at 50% 50%, var(--color-prog-low), var(--color-prog-mid), var(--color-prog-high), var(--color-prog-low)); mask: radial-gradient(circle at 50% 50%, transparent 5px, #000 6px); -webkit-mask: radial-gradient(circle at 50% 50%, transparent 5px, #000 6px);"
		></div>
		<div class="text-[15px] font-semibold tracking-[0.02em]">
			study<span class="font-semibold text-ink">-nav</span>
		</div>
	</div>

	<nav class="flex flex-col gap-0.5" aria-label="メインナビゲーション">
		<div class="my-1 px-2.5 text-[10.5px] uppercase tracking-[0.14em] text-ink-4">Workspace</div>
		<a href="/" class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-ink-2 no-underline" class:active={isActive('/')}>
			<span class="nav-dot size-1.5 shrink-0 rounded-full" class:active-dot={isActive('/')}></span>
			ダッシュボード
		</a>
		<a href="/past-exams" class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-ink-2 no-underline" class:active={isActive('/past-exams')}>
			<span class="nav-dot size-1.5 shrink-0 rounded-full" class:active-dot={isActive('/past-exams')}></span>
			過去問一覧
		</a>

		{#if pinnedSubjects.length > 0}
			<div class="mb-1.5 mt-4 px-2.5 text-[10.5px] uppercase tracking-[0.14em] text-ink-4">Pinned</div>
			{#each pinnedSubjects as subject}
				<a
					href="/subjects/{subject.id}"
					class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-ink-2 no-underline"
					class:active={currentPath === `/subjects/${subject.id}`}
				>
					<span class="size-1.5 shrink-0 rounded-full bg-pin"></span>
					{subject.name}
				</a>
			{/each}
		{/if}
	</nav>

	<div class="mt-auto rounded-[10px] border border-hairline-soft bg-surface-1 px-3 py-2.5">
		<div class="text-[11px] uppercase tracking-[0.08em] text-ink-4">Term</div>
		<div class="mt-0.5 flex items-center justify-between text-[13.5px] text-ink">
			<span>{term}</span>
			<span class="mono" style="color:var(--color-ink-3)">⌄</span>
		</div>
	</div>
</aside>

<style>
	nav a.active {
		background: var(--color-surface-2);
		color: var(--color-ink);
	}
	nav a:hover:not(.active) {
		background: var(--color-surface-1);
		color: var(--color-ink);
	}
	.active-dot {
		background: var(--color-prog-high);
	}
	.nav-dot {
		background: var(--color-ink-4);
	}
</style>
