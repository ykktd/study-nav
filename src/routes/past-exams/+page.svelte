<script lang="ts">
	import { untrack } from 'svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import CheckBox from '$lib/components/CheckBox.svelte';
	import type { PageData } from './$types';
	import type { Subject, Resource } from '$lib/types';
	import { formatExamDate } from '$lib/types';

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();

	// Snapshot server data once for local optimistic state (untrack = intentional initial capture)
	let resources = $state<Resource[]>(untrack(() => [...(data.resources as Resource[])]));
	const subjects: Subject[] = untrack(() => [...(data.subjects as Subject[])]);

	// Filter state
	let statusFilter = $state<'all' | 'todo' | 'done'>('all');
	let selectedSubjects = $state<Set<string>>(new Set());
	let query = $state('');
	let viewMode = $state<'grouped' | 'flat'>('grouped');

	const subjectMap = $derived(new Map(subjects.map((s) => [s.id, s])));

	function visible(): Resource[] {
		return resources.filter((r) => {
			if (statusFilter === 'todo' && r.done) return false;
			if (statusFilter === 'done' && !r.done) return false;
			if (selectedSubjects.size > 0 && !selectedSubjects.has(r.subject_id)) return false;
			if (query) {
				const subj = subjectMap.get(r.subject_id);
				const hay = `${r.name} ${subj?.name ?? ''} ${r.url}`.toLowerCase();
				if (!hay.includes(query.toLowerCase())) return false;
			}
			return true;
		});
	}

	const visibleItems = $derived(visible());

	const totalCount = $derived(visibleItems.length);
	const doneCount = $derived(visibleItems.filter((r) => r.done).length);
	const pct = $derived(totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0);

	// Counts for status seg (respecting subject/query filters but not status filter)
	function basePool(): Resource[] {
		return resources.filter((r) => {
			if (selectedSubjects.size > 0 && !selectedSubjects.has(r.subject_id)) return false;
			if (query) {
				const subj = subjectMap.get(r.subject_id);
				const hay = `${r.name} ${subj?.name ?? ''} ${r.url}`.toLowerCase();
				if (!hay.includes(query.toLowerCase())) return false;
			}
			return true;
		});
	}
	const base = $derived(basePool());
	const baseDone = $derived(base.filter((r) => r.done).length);

	// Subject chip counts
	function subjectCounts() {
		const map = new Map<string, { total: number; done: number }>();
		subjects.forEach((s) => map.set(s.id, { total: 0, done: 0 }));
		resources.forEach((r) => {
			const c = map.get(r.subject_id);
			if (c) { c.total++; if (r.done) c.done++; }
		});
		return map;
	}
	const sCounts = $derived(subjectCounts());

	function toggleSubject(id: string) {
		const next = new Set(selectedSubjects);
		if (id === '__all') { next.clear(); }
		else if (next.has(id)) { next.delete(id); }
		else { next.add(id); }
		selectedSubjects = next;
	}

	// Grouped by subject
	function groupedItems(): Array<{ subject: Subject; items: Resource[] }> {
		const map = new Map<string, Resource[]>();
		visibleItems.forEach((r) => {
			const list = map.get(r.subject_id) ?? [];
			list.push(r);
			map.set(r.subject_id, list);
		});
		return subjects
			.filter((s) => map.has(s.id))
			.map((s) => ({ subject: s, items: map.get(s.id)! }));
	}
	const grouped = $derived(groupedItems());

	// Collapsed state per group
	let collapsedGroups = $state<Set<string>>(new Set());
	function toggleGroup(id: string) {
		const next = new Set(collapsedGroups);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		collapsedGroups = next;
	}

	function colorFor(p: number): string {
		if (p >= 100) return 'var(--prog-high)';
		if (p > 66) return 'var(--prog-high)';
		if (p > 33) return 'var(--prog-mid)';
		return 'var(--prog-low)';
	}

	const totalResources = $derived(resources.length);
	const totalDone = $derived(resources.filter((r) => r.done).length);
	const totalPct = $derived(totalResources > 0 ? Math.round((totalDone / totalResources) * 100) : 0);
</script>

<svelte:head>
	<title>study-nav — 過去問一覧</title>
</svelte:head>

<div class="main-inner">
	<div class="topbar">
		<div>
			<div class="crumbs mono">/ past-exams</div>
			<h1>過去問一覧</h1>
			<div class="sub">全科目の過去問を横断で管理。</div>
		</div>
	</div>

	<!-- summary -->
	<section class="summary">
		<div class="cell">
			<ProgressRing done={totalDone} total={totalResources} size={56} stroke={5} />
			<div class="cell-text">
				<div class="k">全体進捗</div>
				<div class="v mono">{totalPct}<span class="unit">%</span></div>
			</div>
		</div>
		<div class="cell">
			<div class="cell-text">
				<div class="k">総数</div>
				<div class="v mono">{totalResources}<span class="unit"> 件</span></div>
			</div>
		</div>
		<div class="cell">
			<div class="cell-text">
				<div class="k">完了</div>
				<div class="v mono">{totalDone}<span class="unit"> 件</span></div>
			</div>
		</div>
		<div class="cell">
			<div class="cell-text">
				<div class="k">残り</div>
				<div class="v mono">{totalResources - totalDone}<span class="unit"> 件</span></div>
			</div>
		</div>
	</section>

	<!-- filter bar -->
	<div class="filters">
		<div class="search">
			<svg class="i i-sm" viewBox="0 0 24 24"
				><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg
			>
			<input id="q" bind:value={query} placeholder="ファイル名・科目で検索..." />
		</div>
		<div class="seg" role="tablist">
			{#each [
				{ key: 'all', label: 'すべて', count: base.length },
				{ key: 'todo', label: '未完了', count: base.length - baseDone },
				{ key: 'done', label: '完了', count: baseDone }
			] as seg}
				<button
					role="tab"
					aria-selected={statusFilter === seg.key}
					class:on={statusFilter === seg.key}
					onclick={() => (statusFilter = seg.key as 'all' | 'todo' | 'done')}
				>
					{seg.label} <span class="count mono">{seg.count}</span>
				</button>
			{/each}
		</div>
		<div class="seg">
			<button class:on={viewMode === 'grouped'} onclick={() => (viewMode = 'grouped')}>科目別</button>
			<button class:on={viewMode === 'flat'} onclick={() => (viewMode = 'flat')}>フラット</button>
		</div>
	</div>

	<!-- subject chips -->
	<div class="subject-chips">
		<button
			class="s-chip"
			class:on={selectedSubjects.size === 0}
			onclick={() => toggleSubject('__all')}
		>
			すべての科目
			<span class="c mono">{totalDone}/{totalResources}</span>
		</button>
		{#each subjects as s}
			{@const sc = sCounts.get(s.id) ?? { total: 0, done: 0 }}
			<button
				class="s-chip"
				class:on={selectedSubjects.has(s.id)}
				onclick={() => toggleSubject(s.id)}
			>
				{s.name}
				<span class="c mono">{sc.done}/{sc.total}</span>
			</button>
		{/each}
	</div>

	<!-- body -->
	{#if visibleItems.length === 0}
		<div class="empty">条件に一致する過去問がありません。</div>
	{:else if viewMode === 'grouped'}
		{#each grouped as group (group.subject.id)}
			{@const t = group.items.length}
			{@const d = group.items.filter((r) => r.done).length}
			{@const p = t > 0 ? Math.round((d / t) * 100) : 0}
			{@const collapsed = collapsedGroups.has(group.subject.id)}
			<section class="group" class:collapsed>
				<header
					class="group-head"
					role="button"
					tabindex="0"
					onclick={() => toggleGroup(group.subject.id)}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleGroup(group.subject.id)}
				>
					<div class="group-left">
						<span class="chev mono" style:transform={collapsed ? 'rotate(-90deg)' : ''}>⌄</span>
						<span class="group-title">{group.subject.name}</span>
						{#if group.subject.exam_date}
							<span class="group-exam">試験 {formatExamDate(group.subject.exam_date)}</span>
						{/if}
					</div>
					<div class="group-meta">
						<div class="mini-bar">
							<span style="width:{p}%; background:{colorFor(p)}"></span>
						</div>
						<span class="group-frac mono">{d}/{t}</span>
					</div>
				</header>
				{#if !collapsed}
					<div class="group-body">
						<div class="row head">
							<div></div>
							<div>ファイル名</div>
							<div>科目</div>
							<div>種別</div>
							<div></div>
						</div>
						{#each group.items as item (item.id)}
							{@render resourceRow(item, group.subject)}
						{/each}
					</div>
				{/if}
			</section>
		{/each}
	{:else}
		<section class="group">
			<div class="group-body">
				<div class="row head">
					<div></div>
					<div>ファイル名</div>
					<div>科目</div>
					<div>種別</div>
					<div></div>
				</div>
				{#each visibleItems as item (item.id)}
					{@render resourceRow(item, subjectMap.get(item.subject_id)!)}
				{/each}
			</div>
		</section>
	{/if}
</div>

{#snippet resourceRow(item: Resource, subj: Subject)}
	<div class="row" class:done-row={item.done}>
		<CheckBox
			resourceId={item.id}
			bind:done={item.done}
		/>
		<div>
			<div class="name">{item.name}</div>
		</div>
		<div>
			<span class="subj-tag">{subj?.name ?? '—'}</span>
		</div>
		<div>
			<span class="kind">{item.url.includes('drive.google.com') ? 'Drive' : new URL(item.url).hostname.replace('www.', '')}</span>
		</div>
		<div class="row-actions">
			<a
				href={item.url}
				target="_blank"
				rel="noopener noreferrer"
				class="icon-btn"
				title="開く"
				onclick={(e) => e.stopPropagation()}
			>
				<svg class="i i-sm" viewBox="0 0 24 24"
					><path
						d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
					/></svg
				>
			</a>
		</div>
	</div>
{/snippet}

<style>
	.main-inner {
		padding: 34px 48px 80px;
		max-width: 1280px;
		width: 100%;
	}
	.topbar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: 24px;
		gap: 24px;
	}
	.crumbs {
		font-size: 12px;
		color: var(--ink-4);
		letter-spacing: 0.06em;
		margin-bottom: 8px;
	}
	h1 {
		font-size: 26px;
		font-weight: 600;
		margin: 0;
		letter-spacing: -0.01em;
	}
	.sub {
		color: var(--ink-3);
		font-size: 13.5px;
		margin-top: 6px;
	}

	/* summary */
	.summary {
		display: grid;
		grid-template-columns: 1.2fr 1fr 1fr 1fr;
		margin-bottom: 26px;
	}
	.cell {
		padding: 18px 22px 18px 0;
		border-right: 1px solid var(--hairline-soft);
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.cell:first-child { padding-left: 0; }
	.cell:last-child { border-right: none; }
	.cell-text { flex: 1; }
	.k {
		font-size: 11px;
		color: var(--ink-4);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.v {
		font-size: 22px;
		font-weight: 500;
		margin-top: 4px;
		letter-spacing: -0.01em;
	}
	.unit {
		font-size: 13px;
		color: var(--ink-3);
		margin-left: 4px;
		font-weight: 400;
	}

	/* filter bar */
	.filters {
		display: flex;
		align-items: center;
		gap: 14px;
		border: 1px solid var(--hairline-soft);
		border-radius: 10px;
		background: var(--surface-1);
		padding: 10px 14px;
		margin-bottom: 18px;
		flex-wrap: wrap;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		min-width: 240px;
		background: var(--surface-2);
		border: 1px solid var(--hairline-soft);
		border-radius: 8px;
		padding: 6px 10px;
		color: var(--ink-3);
	}
	.search input {
		background: transparent;
		border: none;
		outline: none;
		color: var(--ink);
		font: inherit;
		flex: 1;
		font-size: 13px;
	}
	.search input::placeholder { color: var(--ink-4); }
	.seg {
		display: flex;
		border: 1px solid var(--hairline-soft);
		border-radius: 8px;
		overflow: hidden;
		background: var(--surface-2);
	}
	.seg button {
		padding: 6px 12px;
		border: none;
		background: transparent;
		color: var(--ink-3);
		font-size: 12.5px;
		cursor: pointer;
		border-right: 1px solid var(--hairline-soft);
		font: inherit;
	}
	.seg button:last-child { border-right: none; }
	.seg button.on { background: var(--surface-3); color: var(--ink); }
	.count {
		font-size: 10.5px;
		color: var(--ink-4);
		margin-left: 6px;
	}
	.seg button.on .count { color: var(--ink-3); }

	/* subject chips */
	.subject-chips {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: 18px;
	}
	.s-chip {
		font: inherit;
		font-size: 12.5px;
		padding: 6px 12px;
		border-radius: 999px;
		border: 1px solid var(--hairline-soft);
		background: transparent;
		color: var(--ink-3);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.s-chip:hover { color: var(--ink); border-color: var(--hairline); }
	.s-chip.on { background: var(--surface-2); color: var(--ink); border-color: var(--hairline); }
	.c {
		font-size: 10.5px;
		color: var(--ink-4);
	}
	.s-chip.on .c { color: var(--ink-3); }

	/* groups */
	.group {
		border: 1px solid var(--hairline-soft);
		border-radius: 12px;
		background: var(--surface-1);
		margin-bottom: 14px;
		overflow: hidden;
	}
	.group-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		border-bottom: 1px solid var(--hairline-soft);
		background: var(--surface-2);
		cursor: pointer;
	}
	.group-head:hover { background: var(--surface-3); }
	.group.collapsed .group-head { border-bottom: none; }
	.group-left {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}
	.chev {
		color: var(--ink-3);
		transition: transform 0.15s;
	}
	.group-title {
		font-size: 14.5px;
		font-weight: 500;
		color: var(--ink);
	}
	.group-meta {
		display: flex;
		align-items: center;
		gap: 12px;
		color: var(--ink-3);
		font-size: 12px;
	}
	.group-exam {
		font-family: 'IBM Plex Mono', monospace;
		color: var(--ink-4);
		font-size: 11.5px;
	}
	.mini-bar {
		width: 140px;
		height: 5px;
		background: var(--track);
		border-radius: 999px;
		overflow: hidden;
	}
	.mini-bar span {
		display: block;
		height: 100%;
		border-radius: 999px;
		transition: width 0.4s ease, background 0.3s;
	}
	.group-frac {
		color: var(--ink-2);
		font-size: 12.5px;
		min-width: 42px;
		text-align: right;
	}

	/* table rows */
	.group-body { display: flex; flex-direction: column; }
	.row {
		display: grid;
		grid-template-columns: 24px 1.6fr 0.8fr 0.8fr 60px;
		align-items: center;
		gap: 14px;
		padding: 10px 18px;
		border-bottom: 1px solid var(--hairline-soft);
		transition: background 0.12s;
	}
	.row:last-child { border-bottom: none; }
	.row:hover:not(.head) { background: var(--surface-2); }
	.row.head {
		font-size: 10.5px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--ink-4);
		padding: 8px 18px;
		cursor: default;
	}
	.row.head:hover { background: transparent; }
	.name {
		font-size: 13.5px;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.done-row .name {
		color: var(--ink-3);
		text-decoration: line-through;
		text-decoration-color: var(--ink-4);
	}
	.subj-tag {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 12.5px;
		color: var(--ink-2);
		padding: 4px 10px;
		border-radius: 6px;
		border: 1px solid var(--hairline-soft);
		background: var(--surface-2);
		white-space: nowrap;
	}
	.kind {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 10.5px;
		color: var(--ink-3);
		padding: 2px 7px;
		border-radius: 4px;
		border: 1px solid var(--hairline-soft);
		display: inline-block;
		background: var(--surface-2);
	}
	.row-actions {
		display: flex;
		gap: 2px;
		justify-content: flex-end;
		opacity: 0;
		transition: 0.15s;
	}
	.row:hover .row-actions { opacity: 1; }

	.icon-btn {
		width: 26px;
		height: 26px;
		padding: 0;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--ink-3);
		border-radius: 6px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		text-decoration: none;
	}
	.icon-btn:hover { background: var(--surface-3); color: var(--ink); }
	.i {
		width: 14px;
		height: 14px;
		stroke: currentColor;
		fill: none;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.i-sm { width: 12px; height: 12px; }

	.empty {
		padding: 60px 20px;
		text-align: center;
		color: var(--ink-3);
		border: 1px dashed var(--hairline-soft);
		border-radius: 12px;
	}
</style>
