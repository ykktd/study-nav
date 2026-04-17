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

<aside class="side">
	<div class="brand">
		<div class="brand-mark" aria-hidden="true"></div>
		<div class="brand-name">study<span class="accent">-nav</span></div>
	</div>

	<nav class="nav" aria-label="メインナビゲーション">
		<div class="nav-label">Workspace</div>
		<a href="/" class:active={isActive('/')}>
			<span class="dot" class:active-dot={isActive('/')}></span>
			ダッシュボード
		</a>
		<a href="/past-exams" class:active={isActive('/past-exams')}>
			<span class="dot" class:active-dot={isActive('/past-exams')}></span>
			過去問一覧
		</a>

		{#if pinnedSubjects.length > 0}
			<div class="nav-label" style="margin-top:16px">Pinned</div>
			{#each pinnedSubjects as subject}
				<a
					href="/subjects/{subject.id}"
					class:active={currentPath === `/subjects/${subject.id}`}
				>
					<span class="dot" style="background:oklch(0.60 0.04 180)"></span>
					{subject.name}
				</a>
			{/each}
		{/if}
	</nav>

	<div class="term-picker">
		<div class="k">Term</div>
		<div class="v">
			<span>{term}</span>
			<span class="mono" style="color:var(--ink-3)">⌄</span>
		</div>
	</div>
</aside>

<style>
	.side {
		border-right: 1px solid var(--hairline-soft);
		padding: 22px 18px;
		display: flex;
		flex-direction: column;
		gap: 28px;
		position: sticky;
		top: 0;
		height: 100vh;
		background: linear-gradient(180deg, var(--bg), oklch(0.175 0.008 250));
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 4px 6px;
	}
	.brand-mark {
		width: 26px;
		height: 26px;
		border-radius: 7px;
		background: conic-gradient(
			from 210deg at 50% 50%,
			var(--prog-low),
			var(--prog-mid),
			var(--prog-high),
			var(--prog-low)
		);
		mask: radial-gradient(circle at 50% 50%, transparent 5px, #000 6px);
		-webkit-mask: radial-gradient(circle at 50% 50%, transparent 5px, #000 6px);
	}
	.brand-name {
		font-weight: 600;
		letter-spacing: 0.02em;
		font-size: 15px;
	}
	.accent {
		color: var(--ink);
		font-weight: 600;
	}
	.nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.nav-label {
		font-size: 10.5px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-4);
		padding: 0 10px;
		margin: 4px 0 6px;
	}
	.nav a {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 8px;
		color: var(--ink-2);
		text-decoration: none;
		font-size: 13.5px;
	}
	.nav a.active {
		background: var(--surface-2);
		color: var(--ink);
	}
	.nav a:hover:not(.active) {
		background: var(--surface-1);
		color: var(--ink);
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--ink-4);
		flex-shrink: 0;
	}
	.nav a.active .dot {
		background: var(--prog-high);
	}
	.term-picker {
		margin-top: auto;
		border: 1px solid var(--hairline-soft);
		border-radius: 10px;
		padding: 10px 12px;
		background: var(--surface-1);
	}
	.term-picker .k {
		font-size: 11px;
		color: var(--ink-4);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.term-picker .v {
		font-size: 13.5px;
		color: var(--ink);
		margin-top: 2px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
</style>
