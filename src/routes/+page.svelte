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
	let showModal = $state(false);
	let modalRef = $state<HTMLDialogElement | null>(null);

	function openModal() {
		showModal = true;
		modalRef?.showModal();
	}
	function closeModal() {
		showModal = false;
		modalRef?.close();
	}
</script>

<svelte:head>
	<title>study-nav — ダッシュボード</title>
</svelte:head>

<div class="main-inner">
	<!-- topbar -->
	<div class="topbar">
		<div>
			<div class="crumbs mono">/ dashboard</div>
			<h1>今学期の科目</h1>
			{#if daysToNext !== null}
				<div class="sub">
					試験まで <span class="mono" style="color:var(--ink)">{daysToNext}</span> 日。過去問の進捗を確認しましょう。
				</div>
			{/if}
		</div>
		<div class="actions">
			<button class="btn btn-primary" type="button" onclick={openModal}>
				<span class="plus">＋</span>科目を追加
			</button>
		</div>
	</div>

	<!-- summary -->
	<section class="summary" aria-label="学期サマリー">
		<div class="cell">
			<div class="k">履修科目</div>
			<div class="v mono">{data.subjects.length}<span class="unit">科目</span></div>
		</div>
		<div class="cell">
			<div class="k">過去問 進捗</div>
			<div class="v mono">{data.donePastExams} / {data.totalPastExams}<span class="unit"> 問</span></div>
		</div>
		<div class="cell">
			<div class="k">完了科目</div>
			<div class="v mono">{counts.done}<span class="unit">科目</span></div>
		</div>
		<div class="cell">
			<div class="k">直近の試験</div>
			<div class="v">
				{#if data.nextExam}
					{data.nextExam.name}<span class="unit mono"> · {formatExamDate(data.nextExam.exam_date)}</span>
				{:else}
					—
				{/if}
			</div>
		</div>
	</section>

	<!-- filters -->
	<div class="filters">
		<div class="chips" role="tablist">
			{#each [
				{ key: 'all', label: 'すべて', count: counts.all },
				{ key: 'active', label: '進行中', count: counts.active },
				{ key: 'unstarted', label: '未着手', count: counts.unstarted },
				{ key: 'done', label: '完了', count: counts.done }
			] as chip}
				<button
					class="chip"
					class:on={filter === chip.key}
					role="tab"
					aria-selected={filter === chip.key}
					onclick={() => (filter = chip.key as Filter)}
				>
					{chip.label}
					<span class="mono" style="color:var(--ink-4); margin-left:4px">{chip.count}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- subject grid -->
	<div class="grid">
		{#each filtered as subject (subject.id)}
			<a href="/subjects/{subject.id}" class="card" tabindex="0">
				<div class="card-head">
					<div>
						<div class="card-name">{subject.name}</div>
						<div class="card-meta">
							{#if subject.professor}
								<span>{subject.professor}</span>
							{/if}
							{#if subject.professor && subject.day_period}
								<span class="sep"></span>
							{/if}
							{#if subject.day_period}
								<span class="mono">{subject.day_period}</span>
							{/if}
						</div>
					</div>
					{#if subject.exam_date}
						<div class="mono" style="font-size:11px; color:var(--ink-4); white-space:nowrap">
							試験 {formatExamDate(subject.exam_date)}
						</div>
					{/if}
				</div>
				<div class="card-bottom">
					{#if subject.past_exam_total > 0}
						<ProgressRing done={subject.past_exam_done} total={subject.past_exam_total} />
					{:else}
						<div class="no-exam">
							<span class="tag">過去問 未登録</span>
						</div>
					{/if}
					<div class="go">開く →</div>
				</div>
			</a>
		{/each}

		<button class="card card-add" type="button" onclick={openModal}>
			<span class="plus">＋</span>
			<span>科目を追加</span>
		</button>
	</div>

	<!-- archive section -->
	{#if data.archived.length > 0}
		<div class="section-title">アーカイブ（前学期）</div>
		<div class="grid">
			{#each data.archived as subject (subject.id)}
				<a href="/subjects/{subject.id}" class="card" tabindex="0">
					<div class="card-head">
						<div>
							<div class="card-name">{subject.name}</div>
							<div class="card-meta">
								{#if subject.professor}
									<span>{subject.professor}</span>
								{/if}
								{#if subject.professor && subject.day_period}
									<span class="sep"></span>
								{/if}
								{#if subject.day_period}
									<span class="mono">— 前学期</span>
								{/if}
							</div>
						</div>
						{#if subject.exam_date}
							<div class="mono" style="font-size:11px; color:var(--ink-4); white-space:nowrap">
								試験 {formatExamDate(subject.exam_date)}
							</div>
						{/if}
					</div>
					<div class="card-bottom">
						{#if subject.past_exam_total > 0}
							<ProgressRing done={subject.past_exam_done} total={subject.past_exam_total} />
						{:else}
							<div class="no-exam">
								<span class="tag">過去問 未登録</span>
							</div>
						{/if}
						<div class="go">開く →</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- Add Subject Modal -->
<dialog bind:this={modalRef} class="modal" onclose={closeModal}>
	<div class="modal-inner">
		<div class="modal-head">
			<h2>科目を追加</h2>
			<button class="close-btn" onclick={closeModal} aria-label="閉じる">✕</button>
		</div>
		<form
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
			<label>
				<span>科目名 <span class="required">*</span></span>
				<input name="name" type="text" placeholder="例: 線形代数 II" required />
			</label>
			<label>
				<span>担当教員</span>
				<input name="professor" type="text" placeholder="例: 佐藤 健" />
			</label>
			<label>
				<span>曜限</span>
				<input name="day_period" type="text" placeholder="例: 月1" />
			</label>
			<label>
				<span>試験日</span>
				<input name="exam_date" type="date" />
			</label>
			<input name="term" type="hidden" value={data.term} />
			<div class="modal-actions">
				<button type="button" class="btn" onclick={closeModal}>キャンセル</button>
				<button type="submit" class="btn btn-primary">追加</button>
			</div>
		</form>
	</div>
</dialog>

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
		margin-bottom: 28px;
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
	.actions {
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.btn {
		font: inherit;
		border: 1px solid var(--hairline);
		background: var(--surface-1);
		color: var(--ink);
		padding: 9px 14px;
		border-radius: var(--radius-ctrl);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 13.5px;
		text-decoration: none;
	}
	.btn:hover {
		background: var(--surface-2);
	}
	.btn-primary {
		background: var(--ink);
		color: var(--bg);
		border-color: var(--ink);
	}
	.btn-primary:hover {
		background: oklch(0.88 0.005 250);
	}
	.plus {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 15px;
		line-height: 1;
	}

	/* summary */
	.summary {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border: 1px solid var(--hairline-soft);
		border-radius: 12px;
		background: var(--surface-1);
		margin-bottom: 28px;
		overflow: hidden;
	}
	.cell {
		padding: 16px 20px;
		border-right: 1px solid var(--hairline-soft);
	}
	.cell:last-child {
		border-right: none;
	}
	.k {
		font-size: 11px;
		color: var(--ink-4);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.v {
		font-size: 22px;
		font-weight: 500;
		margin-top: 6px;
		letter-spacing: -0.01em;
	}
	.unit {
		font-size: 13px;
		color: var(--ink-3);
		margin-left: 4px;
		font-weight: 400;
	}

	/* filters */
	.filters {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 14px;
	}
	.chips {
		display: flex;
		gap: 6px;
	}
	.chip {
		font: inherit;
		font-size: 12.5px;
		padding: 6px 11px;
		border-radius: 999px;
		border: 1px solid var(--hairline-soft);
		background: transparent;
		color: var(--ink-3);
		cursor: pointer;
	}
	.chip.on {
		background: var(--surface-2);
		color: var(--ink);
		border-color: var(--hairline);
	}

	/* grid */
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}
	@media (min-width: 1200px) {
		.grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	/* card */
	.card {
		background: var(--surface-1);
		border: 1px solid var(--hairline-soft);
		border-radius: var(--radius-card);
		padding: 18px 18px 16px;
		display: flex;
		flex-direction: column;
		min-height: 176px;
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
		cursor: pointer;
		text-decoration: none;
		color: inherit;
	}
	.card:hover {
		border-color: var(--hairline);
		background: var(--surface-2);
	}
	.card:hover .go {
		opacity: 1;
		transform: translateX(0);
	}
	.card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: auto;
	}
	.card-name {
		font-size: 15.5px;
		font-weight: 600;
		letter-spacing: 0.01em;
		line-height: 1.35;
		color: var(--ink);
	}
	.card-meta {
		margin-top: 6px;
		font-size: 12px;
		color: var(--ink-4);
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--ink-4);
		opacity: 0.6;
	}
	.card-bottom {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-top: 18px;
		gap: 12px;
	}
	.no-exam {
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: flex-start;
		justify-content: flex-end;
		color: var(--ink-4);
		font-size: 11.5px;
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		border-radius: 6px;
		border: 1px dashed var(--hairline);
		color: var(--ink-3);
		font-size: 11px;
		font-family: 'IBM Plex Mono', monospace;
		letter-spacing: 0.02em;
	}
	.go {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 13px;
		color: var(--ink-3);
		opacity: 0;
		transform: translateX(-4px);
		transition: 0.2s ease;
		align-self: flex-end;
		margin-bottom: 6px;
	}

	/* add card */
	.card-add {
		border-style: dashed;
		border-color: var(--hairline-soft);
		background: transparent;
		color: var(--ink-3);
		align-items: center;
		justify-content: center;
		display: flex;
		flex-direction: column;
		gap: 8px;
		font: inherit;
		font-size: 13.5px;
	}
	.card-add:hover {
		border-color: var(--hairline);
		background: var(--surface-1);
		color: var(--ink);
	}
	.card-add .plus {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 20px;
		line-height: 1;
		width: 34px;
		height: 34px;
		border-radius: 8px;
		border: 1px solid var(--hairline-soft);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* section title */
	.section-title {
		font-size: 12px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-4);
		margin: 32px 0 12px;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.section-title::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--hairline-soft);
	}

	/* modal */
	.modal {
		background: var(--surface-2);
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 0;
		color: var(--ink);
		max-width: 420px;
		width: 100%;
	}
	.modal::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}
	.modal-inner {
		padding: 24px 28px;
	}
	.modal-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}
	.modal-head h2 {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
	}
	.close-btn {
		background: transparent;
		border: none;
		color: var(--ink-3);
		cursor: pointer;
		font-size: 14px;
		padding: 4px 8px;
	}
	.close-btn:hover {
		color: var(--ink);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 5px;
		font-size: 12px;
		color: var(--ink-3);
	}
	label span {
		letter-spacing: 0.04em;
	}
	.required {
		color: var(--prog-low);
	}
	input[type='text'],
	input[type='date'] {
		background: var(--surface-3);
		border: 1px solid var(--hairline-soft);
		border-radius: var(--radius-ctrl);
		color: var(--ink);
		padding: 9px 12px;
		font: inherit;
		font-size: 13.5px;
		outline: none;
	}
	input:focus {
		border-color: var(--hairline);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 8px;
	}
</style>
