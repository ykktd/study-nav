<script lang="ts">
	import { enhance } from '$app/forms';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import type { PageData } from './$types';
	import type { SubjectWithProgress } from '$lib/types';
	import { formatExamDate, daysUntil } from '$lib/types';

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();

	// Filter state
	type Filter = 'all' | 'active' | 'unstarted' | 'done';
	let filter = $state<Filter>('all');

	function subjectStatus(s: SubjectWithProgress): 'done' | 'active' | 'unstarted' | 'no-exam' {
		if (s.past_exam_total === 0) return 'no-exam';
		if (s.past_exam_done === s.past_exam_total) return 'done';
		if (s.past_exam_done > 0) return 'active';
		return 'unstarted';
	}

	const filtered = $derived(
		data.subjects.filter((s) => {
			const st = subjectStatus(s);
			if (filter === 'all') return true;
			if (filter === 'done') return st === 'done';
			if (filter === 'active') return st === 'active';
			if (filter === 'unstarted') return st === 'unstarted' || st === 'no-exam';
			return true;
		})
	);

	const counts = $derived({
		all: data.subjects.length,
		active: data.subjects.filter((s) => subjectStatus(s) === 'active').length,
		unstarted: data.subjects.filter(
			(s) => subjectStatus(s) === 'unstarted' || subjectStatus(s) === 'no-exam'
		).length,
		done: data.subjects.filter((s) => subjectStatus(s) === 'done').length
	});

	// Days until next exam
	const daysToNext = $derived(daysUntil(data.nextExam?.exam_date ?? null));

	// Modal state
	let modalRef = $state<HTMLDialogElement | null>(null);

	function openModal() {
		modalRef?.showModal();
	}
	function closeModal() {
		modalRef?.close();
	}
</script>

<svelte:head>
	<title>study-nav — ダッシュボード</title>
</svelte:head>

<div class="w-full max-w-7xl px-12 pt-8.5 pb-20">
	<!-- topbar -->
	<div class="mb-7 flex items-end justify-between gap-6">
		<div>
			<div class="mono mb-2 text-[12px] tracking-[0.06em] text-ink-4">/ dashboard</div>
			<h1 class="m-0 text-[26px] font-semibold tracking-[-0.01em]">今学期の科目</h1>
			{#if daysToNext !== null}
				<div class="mt-1.5 text-[13.5px] text-ink-3">
					試験まで <span class="mono" style="color:var(--color-ink)">{daysToNext}</span> 日。過去問の進捗を確認しましょう。
				</div>
			{/if}
		</div>
		<div class="flex items-center gap-2.5">
			<button
				class="inline-flex cursor-pointer items-center gap-2 rounded-ctrl border border-ink bg-ink px-[14px] py-2.25 text-[13.5px] font-[inherit] text-bg no-underline hover:bg-ink-hover"
				type="button"
				onclick={openModal}
			>
				<span class="mono text-[15px] leading-none">＋</span>科目を追加
			</button>
		</div>
	</div>

	<!-- summary -->
	<section
		class="mb-7 grid grid-cols-4 overflow-hidden rounded-xl border border-hairline-soft bg-surface-1"
		aria-label="学期サマリー"
	>
		{#each [
			{ k: '履修科目', v: `${data.subjects.length}`, unit: '科目' },
			{ k: '過去問 進捗', v: `${data.donePastExams} / ${data.totalPastExams}`, unit: ' 問' },
			{ k: '完了科目', v: `${counts.done}`, unit: '科目' }
		] as cell}
			<div class="border-r border-hairline-soft px-5 py-4">
				<div class="text-[11px] uppercase tracking-widest text-ink-4">{cell.k}</div>
				<div class="mono mt-1.5 text-[22px] font-medium tracking-[-0.01em]">
					{cell.v}<span class="ml-1 text-[13px] font-normal text-ink-3">{cell.unit}</span>
				</div>
			</div>
		{/each}
		<div class="px-5 py-4">
			<div class="text-[11px] uppercase tracking-widest text-ink-4">直近の試験</div>
			<div class="mt-1.5 text-[22px] font-medium tracking-[-0.01em]">
				{#if data.nextExam}
					{data.nextExam.name}<span class="mono ml-1 text-[13px] font-normal text-ink-3"> · {formatExamDate(data.nextExam.exam_date)}</span>
				{:else}
					—
				{/if}
			</div>
		</div>
	</section>

	<!-- filters -->
	<div class="mb-3.5 flex items-center justify-between">
		<div class="flex gap-1.5" role="tablist">
			{#each [
				{ key: 'all', label: 'すべて', count: counts.all },
				{ key: 'active', label: '進行中', count: counts.active },
				{ key: 'unstarted', label: '未着手', count: counts.unstarted },
				{ key: 'done', label: '完了', count: counts.done }
			] as chip}
				<button
					class="cursor-pointer rounded-full border border-hairline-soft bg-transparent px-[11px] py-1.5 text-[12.5px] font-[inherit] text-ink-3"
					class:on={filter === chip.key}
					role="tab"
					aria-selected={filter === chip.key}
					onclick={() => (filter = chip.key as Filter)}
				>
					{chip.label}
					<span class="mono" style="color:var(--color-ink-4); margin-left:4px">{chip.count}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- subject grid -->
	<div class="grid grid-cols-3 gap-4 xl:grid-cols-4">
		{#each filtered as subject (subject.id)}
			{@render subjectCard(subject)}
		{/each}

		<button
			class="group flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-card border border-dashed border-hairline-soft bg-transparent px-4.5 pt-4.5 pb-4 text-[13.5px] font-[inherit] text-ink-3 hover:border-hairline hover:bg-surface-1 hover:text-ink"
			type="button"
			onclick={openModal}
		>
			<span class="mono flex size-8.5 items-center justify-center rounded-lg border border-hairline-soft text-[20px] leading-none">＋</span>
			<span>科目を追加</span>
		</button>
	</div>

	<!-- archive section -->
	{#if data.archived.length > 0}
		<div class="mt-8 mb-3 flex items-center gap-2.5 text-[12px] uppercase tracking-[0.14em] text-ink-4 after:h-px after:flex-1 after:bg-hairline-soft after:content-['']">
			アーカイブ（前学期）
		</div>
		<div class="grid grid-cols-3 gap-4 xl:grid-cols-4">
			{#each data.archived as subject (subject.id)}
				{@render subjectCard(subject, true)}
			{/each}
		</div>
	{/if}
</div>

{#snippet subjectCard(subject: SubjectWithProgress, archived = false)}
	<a
		href="/subjects/{subject.id}"
		class="group flex min-h-44 cursor-pointer flex-col rounded-card border border-hairline-soft bg-surface-1 px-4.5 pt-4.5 pb-4 text-inherit no-underline transition-[border-color,background] duration-150 hover:border-hairline hover:bg-surface-2"
		tabindex="0"
	>
		<div class="mb-auto flex items-start justify-between gap-3">
			<div>
				<div class="text-[15.5px] font-semibold leading-[1.35] tracking-[0.01em] text-ink">{subject.name}</div>
				<div class="mt-1.5 flex items-center gap-2 text-[12px] text-ink-4">
					{#if subject.professor}
						<span>{subject.professor}</span>
					{/if}
					{#if subject.professor && subject.day_period}
						<span class="size-0.75 rounded-full bg-ink-4 opacity-60"></span>
					{/if}
					{#if subject.day_period}
						<span class="mono">{archived ? '— 前学期' : subject.day_period}</span>
					{/if}
				</div>
			</div>
			{#if subject.exam_date}
				<div class="mono whitespace-nowrap text-[11px] text-ink-4">
					試験 {formatExamDate(subject.exam_date)}
				</div>
			{/if}
		</div>
		<div class="mt-4.5 flex items-end justify-between gap-3">
			{#if subject.past_exam_total > 0}
				<ProgressRing done={subject.past_exam_done} total={subject.past_exam_total} />
			{:else}
				<div class="flex flex-col items-start justify-end gap-1.5 text-[11.5px] text-ink-4">
					<span class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-hairline px-2 py-1 font-['IBM_Plex_Mono',monospace] text-[11px] tracking-[0.02em] text-ink-3">過去問 未登録</span>
				</div>
			{/if}
			<div class="mono mb-1.5 -translate-x-1 self-end text-[13px] text-ink-3 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">開く →</div>
		</div>
	</a>
{/snippet}

<!-- Add Subject Modal -->
<dialog bind:this={modalRef} class="modal m-auto w-full max-w-105 rounded-card border border-hairline bg-surface-2 p-0 text-ink" onclose={closeModal}>
	<div class="px-7 py-6">
		<div class="mb-5 flex items-center justify-between">
			<h2 class="m-0 text-[16px] font-semibold">科目を追加</h2>
			<button class="cursor-pointer border-none bg-transparent px-2 py-1 text-[14px] text-ink-3 hover:text-ink" onclick={closeModal} aria-label="閉じる">✕</button>
		</div>
		<form
			class="flex flex-col gap-3.5"
			method="POST"
			action="?/addSubject"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success' || result.type === 'redirect') {
						closeModal();
					}
					await update();
				};
			}}
		>
			<label class="flex flex-col gap-1.25 text-[12px] text-ink-3">
				<span class="tracking-[0.04em]">科目名 <span class="text-prog-low">*</span></span>
				<input name="name" type="text" placeholder="例: 線形代数 II" required class="rounded-ctrl border border-hairline-soft bg-surface-3 px-3 py-2.25 font-[inherit] text-[13.5px] text-ink outline-none focus:border-hairline" />
			</label>
			<label class="flex flex-col gap-1.25 text-[12px] text-ink-3">
				<span class="tracking-[0.04em]">担当教員</span>
				<input name="professor" type="text" placeholder="例: 佐藤 健" class="rounded-ctrl border border-hairline-soft bg-surface-3 px-3 py-2.25 font-[inherit] text-[13.5px] text-ink outline-none focus:border-hairline" />
			</label>
			<label class="flex flex-col gap-1.25 text-[12px] text-ink-3">
				<span class="tracking-[0.04em]">曜限</span>
				<input name="day_period" type="text" placeholder="例: 月1" class="rounded-ctrl border border-hairline-soft bg-surface-3 px-3 py-2.25 font-[inherit] text-[13.5px] text-ink outline-none focus:border-hairline" />
			</label>
			<label class="flex flex-col gap-1.25 text-[12px] text-ink-3">
				<span class="tracking-[0.04em]">試験日</span>
				<input name="exam_date" type="date" class="rounded-ctrl border border-hairline-soft bg-surface-3 px-3 py-2.25 font-[inherit] text-[13.5px] text-ink outline-none focus:border-hairline" />
			</label>
			<input name="term" type="hidden" value={data.term} />
			<div class="mt-2 flex justify-end gap-2">
				<button type="button" class="inline-flex cursor-pointer items-center gap-2 rounded-ctrl border border-hairline bg-surface-1 px-3.5 py-2.25 text-[13.5px] font-[inherit] text-ink hover:bg-surface-2" onclick={closeModal}>キャンセル</button>
				<button type="submit" class="inline-flex cursor-pointer items-center gap-2 rounded-ctrl border border-ink bg-ink px-3.5 py-2.25 text-[13.5px] font-[inherit] text-bg hover:bg-ink-hover">追加</button>
			</div>
		</form>
	</div>
</dialog>

<style>
	/* chip active state */
	button.on {
		background: var(--color-surface-2);
		color: var(--color-ink);
		border-color: var(--color-hairline);
	}
	/* modal backdrop — no Tailwind utility */
	.modal::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}
</style>
