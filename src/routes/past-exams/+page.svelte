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
		if (p > 66) return 'var(--color-prog-high)';
		if (p > 33) return 'var(--color-prog-mid)';
		return 'var(--color-prog-low)';
	}

	const totalResources = $derived(resources.length);
	const totalDone = $derived(resources.filter((r) => r.done).length);
	const totalPct = $derived(totalResources > 0 ? Math.round((totalDone / totalResources) * 100) : 0);
</script>

<svelte:head>
	<title>study-nav — 過去問一覧</title>
</svelte:head>

<div class="w-full max-w-7xl px-12 pt-8.5 pb-20">
	<div class="mb-6 flex items-end justify-between gap-6">
		<div>
			<div class="mono mb-2 text-[12px] tracking-[0.06em] text-ink-4">/ past-exams</div>
			<h1 class="m-0 text-[26px] font-semibold tracking-[-0.01em]">過去問一覧</h1>
			<div class="mt-1.5 text-[13.5px] text-ink-3">全科目の過去問を横断で管理。</div>
		</div>
	</div>

	<!-- summary -->
	<section class="mb-6.5 grid grid-cols-[1.2fr_1fr_1fr_1fr]">
		<div class="flex items-center gap-4 border-r border-hairline-soft py-4.5 pr-5.5">
			<ProgressRing done={totalDone} total={totalResources} size={56} stroke={5} />
			<div class="flex-1">
				<div class="text-[11px] uppercase tracking-widest text-ink-4">全体進捗</div>
				<div class="mono mt-1 text-[22px] font-medium tracking-[-0.01em]">{totalPct}<span class="ml-1 text-[13px] font-normal text-ink-3">%</span></div>
			</div>
		</div>
		{#each [
			{ k: '総数', v: totalResources, unit: ' 件' },
			{ k: '完了', v: totalDone, unit: ' 件' },
			{ k: '残り', v: totalResources - totalDone, unit: ' 件' }
		] as cell, i}
			<div class="flex items-center gap-4 px-5.5 py-4.5" class:border-r={i < 2} class:border-hairline-soft={i < 2}>
				<div class="flex-1">
					<div class="text-[11px] uppercase tracking-widest text-ink-4">{cell.k}</div>
					<div class="mono mt-1 text-[22px] font-medium tracking-[-0.01em]">{cell.v}<span class="ml-1 text-[13px] font-normal text-ink-3">{cell.unit}</span></div>
				</div>
			</div>
		{/each}
	</section>

	<!-- filter bar -->
	<div class="mb-4.5 flex flex-wrap items-center gap-3.5 rounded-[10px] border border-hairline-soft bg-surface-1 px-3.5 py-2.5">
		<div class="flex min-w-60 flex-1 items-center gap-2 rounded-lg border border-hairline-soft bg-surface-2 px-2.5 py-1.5 text-ink-3">
			<svg class="size-3 shrink-0 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24"
				><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg
			>
			<input
				id="q"
				bind:value={query}
				placeholder="ファイル名・科目で検索..."
				class="flex-1 border-none bg-transparent font-[inherit] text-[13px] text-ink outline-none placeholder:text-ink-4"
			/>
		</div>
		<div class="flex overflow-hidden rounded-lg border border-hairline-soft bg-surface-2">
			{#each [
				{ key: 'all', label: 'すべて', count: base.length },
				{ key: 'todo', label: '未完了', count: base.length - baseDone },
				{ key: 'done', label: '完了', count: baseDone }
			] as seg}
				<button
					role="tab"
					aria-selected={statusFilter === seg.key}
					class="cursor-pointer border-none border-r border-hairline-soft bg-transparent px-3 py-1.5 font-[inherit] text-[12.5px] text-ink-3 last:border-r-0"
					class:on={statusFilter === seg.key}
					onclick={() => (statusFilter = seg.key as 'all' | 'todo' | 'done')}
				>
					{seg.label} <span class="mono ml-1.5 text-[10.5px] text-ink-4" class:on-count={statusFilter === seg.key}>{seg.count}</span>
				</button>
			{/each}
		</div>
		<div class="flex overflow-hidden rounded-lg border border-hairline-soft bg-surface-2">
			<button class="cursor-pointer border-none border-r border-hairline-soft bg-transparent px-3 py-1.5 font-[inherit] text-[12.5px] text-ink-3" class:on={viewMode === 'grouped'} onclick={() => (viewMode = 'grouped')}>科目別</button>
			<button class="cursor-pointer border-none bg-transparent px-3 py-1.5 font-[inherit] text-[12.5px] text-ink-3" class:on={viewMode === 'flat'} onclick={() => (viewMode = 'flat')}>フラット</button>
		</div>
	</div>

	<!-- subject chips -->
	<div class="mb-4.5 flex flex-wrap gap-1.5">
		<button
			class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-hairline-soft bg-transparent px-3 py-1.5 text-[12.5px] font-[inherit] text-ink-3 hover:border-hairline hover:text-ink"
			class:on={selectedSubjects.size === 0}
			onclick={() => toggleSubject('__all')}
		>
			すべての科目
			<span class="mono text-[10.5px] text-ink-4">{totalDone}/{totalResources}</span>
		</button>
		{#each subjects as s}
			{@const sc = sCounts.get(s.id) ?? { total: 0, done: 0 }}
			<button
				class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-hairline-soft bg-transparent px-3 py-1.5 text-[12.5px] font-[inherit] text-ink-3 hover:border-hairline hover:text-ink"
				class:on={selectedSubjects.has(s.id)}
				onclick={() => toggleSubject(s.id)}
			>
				{s.name}
				<span class="mono text-[10.5px] text-ink-4" class:on-count={selectedSubjects.has(s.id)}>{sc.done}/{sc.total}</span>
			</button>
		{/each}
	</div>

	<!-- body -->
	{#if visibleItems.length === 0}
		<div class="rounded-xl border border-dashed border-hairline-soft px-5 py-15 text-center text-ink-3">条件に一致する過去問がありません。</div>
	{:else if viewMode === 'grouped'}
		{#each grouped as group (group.subject.id)}
			{@const t = group.items.length}
			{@const d = group.items.filter((r) => r.done).length}
			{@const p = t > 0 ? Math.round((d / t) * 100) : 0}
			{@const collapsed = collapsedGroups.has(group.subject.id)}
			<section class="mb-3.5 overflow-hidden rounded-xl border border-hairline-soft bg-surface-1">
				<header
					class="flex cursor-pointer items-center justify-between border-b border-hairline-soft bg-surface-2 px-4.5 py-3.5 hover:bg-surface-3"
					class:no-border={collapsed}
					role="button"
					tabindex="0"
					onclick={() => toggleGroup(group.subject.id)}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleGroup(group.subject.id)}
				>
					<div class="flex min-w-0 items-center gap-3">
						<span class="mono text-ink-3 transition-transform duration-150" style:transform={collapsed ? 'rotate(-90deg)' : ''}>⌄</span>
						<span class="text-[14.5px] font-medium text-ink">{group.subject.name}</span>
						{#if group.subject.exam_date}
							<span class="mono text-[11.5px] text-ink-4">試験 {formatExamDate(group.subject.exam_date)}</span>
						{/if}
					</div>
					<div class="flex items-center gap-3 text-[12px] text-ink-3">
						<div class="h-1.25 w-35 overflow-hidden rounded-full bg-track">
							<span class="block h-full rounded-full transition-[width] duration-400" style="width:{p}%; background:{colorFor(p)}"></span>
						</div>
						<span class="mono min-w-10.5 text-right text-[12.5px] text-ink-2">{d}/{t}</span>
					</div>
				</header>
				{#if !collapsed}
					<div class="flex flex-col">
						<div class="row-head row-grid border-b border-hairline-soft px-4.5 py-2 text-[10.5px] uppercase tracking-[0.12em] text-ink-4">
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
		<section class="overflow-hidden rounded-xl border border-hairline-soft bg-surface-1">
			<div class="flex flex-col">
				<div class="row-head row-grid border-b border-hairline-soft px-4.5 py-2 text-[10.5px] uppercase tracking-[0.12em] text-ink-4">
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
	<div
		class="group row-grid border-b border-hairline-soft px-4.5 py-2.5 transition-[background] duration-120 last:border-b-0 hover:bg-surface-2"
		class:done-row={item.done}
	>
		<CheckBox
			resourceId={item.id}
			bind:done={item.done}
		/>
		<div>
			<div class="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] text-ink" class:line-through={item.done} class:text-ink-3={item.done}>{item.name}</div>
		</div>
		<div>
			<span class="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-hairline-soft bg-surface-2 px-2.5 py-1 text-[12.5px] text-ink-2">{subj?.name ?? '—'}</span>
		</div>
		<div>
			<span class="mono inline-block rounded border border-hairline-soft bg-surface-2 px-1.75 py-0.5 text-[10.5px] text-ink-3">{item.url.includes('drive.google.com') ? 'Drive' : new URL(item.url).hostname.replace('www.', '')}</span>
		</div>
		<div class="flex justify-end gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
			<a
				href={item.url}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex size-6.5 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-ink-3 no-underline hover:bg-surface-3 hover:text-ink"
				title="開く"
				onclick={(e) => e.stopPropagation()}
			>
				<svg class="size-3 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24"
					><path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg
				>
			</a>
		</div>
	</div>
{/snippet}

<style>
	/* row grid layout — shared between header and data rows */
	.row-grid {
		display: grid;
		grid-template-columns: 24px 1.6fr 0.8fr 0.8fr 60px;
		gap: 14px;
		align-items: center;
	}

	/* seg / chip active states */
	button.on {
		background: var(--color-surface-3);
		color: var(--color-ink);
	}
	.on-count {
		color: var(--color-ink-3);
	}
	/* group header with no bottom border when collapsed */
	header.no-border {
		border-bottom: none;
	}
	/* done row strikethrough decoration color */
	.done-row .line-through {
		text-decoration-color: var(--color-ink-4);
	}
</style>
