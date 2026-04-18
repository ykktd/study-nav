<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import CheckBox from '$lib/components/CheckBox.svelte';
	import type { PageData } from './$types';
	import type { Resource } from '$lib/types';
	import { toPreviewUrl, daysUntil } from '$lib/types';

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();

	// Snapshot server data once for local optimistic state (untrack = intentional initial capture)
	let resources = $state<Resource[]>(untrack(() => [...(data.resources as Resource[])]));

	const pastExams = $derived(resources.filter((r) => r.category === 'past_exam'));
	const lectureRes = $derived(resources.filter((r) => r.category === 'lecture'));
	const otherRes = $derived(resources.filter((r) => r.category === 'other'));

	const pastExamDone = $derived(pastExams.filter((r) => r.done).length);
	const pastExamTotal = $derived(pastExams.length);

	// Preview state
	let selectedResource = $state<Resource | null>(null);
	let previewOpen = $state(true);

	function selectResource(r: Resource) {
		selectedResource = r;
		if (!previewOpen) previewOpen = true;
	}

	function previewUrl(r: Resource): string {
		return toPreviewUrl(r.url);
	}

	function canPreview(r: Resource): boolean {
		const url = r.url.toLowerCase();
		if (url.includes('drive.google.com')) return true;
		if (url.endsWith('.pdf')) return true;
		return false;
	}

	// Add resource modal
	let modalRef = $state<HTMLDialogElement | null>(null);
	let defaultCategory = $state<'past_exam' | 'lecture' | 'other'>('past_exam');

	function openAddModal(cat: 'past_exam' | 'lecture' | 'other') {
		defaultCategory = cat;
		modalRef?.showModal();
	}
	function closeModal() {
		modalRef?.close();
	}

	const subject = $derived(data.subject);
	const examDays = $derived(daysUntil(subject.exam_date));
</script>

<svelte:head>
	<title>study-nav — {subject.name}</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- header -->
	<header class="flex items-start justify-between gap-6 border-b border-hairline-soft px-10 pt-6.5 pb-5.5">
		<div>
			<div class="mb-2.5 flex items-center gap-1.5 text-[12.5px] text-ink-3">
				<a href="/" class="text-ink-3 no-underline hover:text-ink">ダッシュボード</a>
				<span class="text-ink-4">/</span>
				<span class="font-medium text-ink">{subject.name}</span>
			</div>
			<div class="flex items-center gap-3.5">
				<h1 class="m-0 text-[24px] font-semibold tracking-[-0.01em]">{subject.name}</h1>
			</div>
			<div class="mt-2 flex gap-4.5 text-[12.5px] text-ink-3">
				{#if subject.professor}
					<div><span class="mr-1.5 tracking-[0.04em] text-ink-4">担当</span><span class="text-ink-2">{subject.professor}</span></div>
				{/if}
				{#if subject.day_period}
					<div><span class="mr-1.5 tracking-[0.04em] text-ink-4">曜限</span><span class="mono text-ink-2">{subject.day_period}</span></div>
				{/if}
				{#if subject.exam_date}
					<div><span class="mr-1.5 tracking-[0.04em] text-ink-4">試験日</span><span class="mono text-ink-2">{subject.exam_date}</span></div>
					{#if examDays !== null}
						<div><span class="mr-1.5 tracking-[0.04em] text-ink-4">あと</span><span class="mono text-ink-2">{examDays} 日</span></div>
					{/if}
				{/if}
			</div>
		</div>
		<div class="flex items-center gap-4.5">
			<div title="過去問 {pastExamDone}/{pastExamTotal} 完了">
				<ProgressRing done={pastExamDone} total={pastExamTotal} size={56} stroke={5} />
			</div>
			<div class="flex gap-2">
				<button
					class="btn btn-primary"
					type="button"
					onclick={() => openAddModal('past_exam')}
				>
					<span class="text-[15px] leading-none">＋</span>リンクを追加
				</button>
			</div>
		</div>
	</header>

	<!-- body -->
	<div class="flex flex-1 min-h-0" style="height: calc(100vh - 140px)" class:grid={previewOpen} class:preview-grid={previewOpen}>
		<!-- left: resource list -->
		<section class="overflow-y-auto border-r border-hairline-soft px-10 pt-5.5 pb-10" style="padding-left:40px; padding-right:28px">
			{@render categorySection('past_exam', '過去問', pastExams)}
			{@render categorySection('lecture', '講義資料', lectureRes)}
			{@render categorySection('other', 'その他', otherRes)}
		</section>

		<!-- right: preview -->
		{#if previewOpen}
			<section class="flex min-h-0 flex-col overflow-hidden bg-surface-1">
				<div class="flex shrink-0 items-center justify-between border-b border-hairline-soft bg-bg px-5 py-3.5">
					<div class="flex min-w-0 items-center gap-3">
						{#if selectedResource}
							<span class="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-medium text-ink">{selectedResource.name}</span>
						{:else}
							<span class="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-medium" style="color:var(--color-ink-3)">資料を選択してください</span>
						{/if}
					</div>
					<div class="flex shrink-0 items-center gap-1.5">
						{#if selectedResource}
							<a
								href={selectedResource.url}
								target="_blank"
								rel="noopener noreferrer"
								class="icon-btn"
								title="新しいタブで開く"
							>
								<svg class="i" viewBox="0 0 24 24"
									><path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg
								>
							</a>
						{/if}
						<button class="icon-btn" title="プレビューを閉じる" onclick={() => (previewOpen = false)}>
							<svg class="i" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6" /></svg>
						</button>
					</div>
				</div>
				<div class="relative flex-1 overflow-hidden">
					{#if selectedResource}
						{#if canPreview(selectedResource)}
							<iframe
								src={previewUrl(selectedResource)}
								title={selectedResource.name}
								class="h-full w-full border-0 bg-white"
								sandbox="allow-same-origin allow-scripts allow-forms"
							></iframe>
						{:else}
							<div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-ink-3">
								<div class="flex size-14 items-center justify-center rounded-xl border border-dashed border-hairline text-ink-3">
									<svg style="width:22px;height:22px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
										<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
										<path d="M14 3v6h6M9 13h6M9 17h4" />
									</svg>
								</div>
								<div class="text-center text-[14px] text-ink-2">このリンクはプレビューできません</div>
								<div class="max-w-70 text-center text-[12px] text-ink-4">外部サービスの資料は新しいタブで開いてください。</div>
								<a href={selectedResource.url} target="_blank" rel="noopener noreferrer" class="btn btn-primary">
									<svg class="i" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
									新しいタブで開く
								</a>
							</div>
						{/if}
					{:else}
						<div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-ink-3">
							<div class="flex size-14 items-center justify-center rounded-xl border border-dashed border-hairline text-ink-3">
								<svg style="width:22px;height:22px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
									<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
									<path d="M14 3v6h6M9 13h6M9 17h4" />
								</svg>
							</div>
							<div class="text-center text-[14px] text-ink-2">資料を選択してください</div>
							<div class="max-w-70 text-center text-[12px] text-ink-4">左のリストから資料をクリックするとプレビューが表示されます。</div>
						</div>
					{/if}
				</div>
			</section>
		{:else}
			<aside class="flex w-11 flex-col items-center border-l border-hairline-soft bg-bg py-3.5">
				<button class="icon-btn" title="プレビューを開く" onclick={() => (previewOpen = true)}>
					<svg class="i" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg>
				</button>
				<div class="mt-4 text-[11px] uppercase tracking-[0.12em] text-ink-4" style="writing-mode:vertical-rl; transform:rotate(180deg)">Preview</div>
			</aside>
		{/if}
	</div>
</div>

<!-- Add resource modal -->
<dialog bind:this={modalRef} class="modal m-auto w-full max-w-105 rounded-card border border-hairline bg-surface-2 p-0 text-ink" onclose={closeModal}>
	<div class="px-7 py-6">
		<div class="mb-5 flex items-center justify-between">
			<h2 class="m-0 text-[16px] font-semibold">リンクを追加</h2>
			<button class="cursor-pointer border-none bg-transparent px-2 py-1 text-[14px] text-ink-3 hover:text-ink" onclick={closeModal} aria-label="閉じる">✕</button>
		</div>
		<form
			class="flex flex-col gap-3.5"
			method="POST"
			action="?/addResource"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						closeModal();
					}
					await update({ reset: false });
					resources = (data.resources as Resource[]).slice();
				};
			}}
		>
			<label class="flex flex-col gap-1.25 text-[12px] tracking-[0.04em] text-ink-3">
				<span>名前 <span class="text-prog-low">*</span></span>
				<input name="name" type="text" placeholder="例: 2024年度_期末試験_問題.pdf" required class="rounded-ctrl border border-hairline-soft bg-surface-3 px-3 py-2.25 font-[inherit] text-[13.5px] text-ink outline-none focus:border-hairline" />
			</label>
			<label class="flex flex-col gap-1.25 text-[12px] tracking-[0.04em] text-ink-3">
				<span>URL <span class="text-prog-low">*</span></span>
				<input name="url" type="url" placeholder="https://..." required class="rounded-ctrl border border-hairline-soft bg-surface-3 px-3 py-2.25 font-[inherit] text-[13.5px] text-ink outline-none focus:border-hairline" />
			</label>
			<label class="flex flex-col gap-1.25 text-[12px] tracking-[0.04em] text-ink-3">
				<span>カテゴリ <span class="text-prog-low">*</span></span>
				<select name="category" class="rounded-ctrl border border-hairline-soft bg-surface-3 px-3 py-2.25 font-[inherit] text-[13.5px] text-ink outline-none focus:border-hairline">
					<option value="past_exam" selected={defaultCategory === 'past_exam'}>過去問</option>
					<option value="lecture" selected={defaultCategory === 'lecture'}>講義資料</option>
					<option value="other" selected={defaultCategory === 'other'}>その他</option>
				</select>
			</label>
			<div class="mt-2 flex justify-end gap-2">
				<button type="button" class="btn" onclick={closeModal}>キャンセル</button>
				<button type="submit" class="btn btn-primary">追加</button>
			</div>
		</form>
	</div>
</dialog>

{#snippet categorySection(cat: 'past_exam' | 'lecture' | 'other', label: string, items: Resource[])}
	<div class="mt-4.5 first:mt-0">
		<div class="mb-2 flex items-center justify-between px-1">
			<div class="flex items-center gap-2 text-[11.5px] uppercase tracking-[0.14em] text-ink-3">
				{label}
				{#if cat === 'past_exam'}
					<span class="mono rounded bg-surface-2 px-1.5 py-px text-[10.5px] text-ink-4">{pastExamDone} / {pastExamTotal}</span>
				{:else}
					<span class="mono rounded bg-surface-2 px-1.5 py-px text-[10.5px] text-ink-4">{items.length}</span>
				{/if}
			</div>
			<button
				class="inline-flex cursor-pointer items-center gap-1.25 border-none bg-transparent font-[inherit] text-[12px] text-ink-3 hover:text-ink"
				type="button"
				onclick={() => openAddModal(cat)}
			>
				<span class="mono text-[13px]">＋</span>リンクを追加
			</button>
		</div>
		<div class="flex flex-col gap-0.5">
			{#each items as item (item.id)}
				<div
					class="group relative grid cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2.25 hover:bg-surface-1"
					class:active={selectedResource?.id === item.id}
					style="grid-template-columns: 20px 1fr auto"
					onclick={() => selectResource(item)}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && selectResource(item)}
				>
					{#if cat === 'past_exam'}
						<CheckBox resourceId={item.id} bind:done={item.done} />
					{:else}
						<span class="size-1.5 justify-self-center rounded-full bg-ink-4"></span>
					{/if}
					<div class="min-w-0">
						<div class="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] text-ink" class:line-through={cat === 'past_exam' && item.done} class:text-ink-3={cat === 'past_exam' && item.done}>{item.name}</div>
						<div class="mono mt-0.5 text-[11.5px] text-ink-4">{new URL(item.url).hostname}</div>
					</div>
					<div class="flex gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-[.active]:opacity-100">
						<a
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
							class="icon-btn icon-btn-sm"
							title="新しいタブで開く"
							onclick={(e) => e.stopPropagation()}
						>
							<svg class="i i-sm" viewBox="0 0 24 24"
								><path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg
							>
						</a>
					</div>
				</div>
			{/each}
			{#if items.length === 0}
				<div class="px-2.5 py-2 text-[12px] text-ink-4">リンクがありません</div>
			{/if}
		</div>
	</div>
{/snippet}

<style>
	/* 2-pane grid layout */
	.preview-grid {
		grid-template-columns: minmax(340px, 420px) 1fr;
	}

	/* active resource item: highlight + left accent bar */
	.active {
		background: var(--color-surface-2);
		border-color: var(--color-hairline-soft);
	}
	.active::before {
		content: '';
		position: absolute;
		left: -1px;
		top: 10px;
		bottom: 10px;
		width: 2px;
		background: var(--color-ink-2);
		border-radius: 2px;
	}

	/* strikethrough decoration color */
	.line-through {
		text-decoration-color: var(--color-ink-4);
	}

	/* shared icon button */
	.icon-btn {
		width: 28px;
		height: 28px;
		padding: 0;
		justify-content: center;
		border: 1px solid var(--color-hairline-soft);
		background: transparent;
		color: var(--color-ink-2);
		border-radius: 8px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		text-decoration: none;
	}
	.icon-btn:hover {
		background: var(--color-surface-1);
		color: var(--color-ink);
	}
	.icon-btn-sm {
		width: 24px;
		height: 24px;
		border-radius: 6px;
	}

	/* shared buttons */
	.btn {
		font: inherit;
		border: 1px solid var(--color-hairline);
		background: var(--color-surface-1);
		color: var(--color-ink);
		padding: 8px 13px;
		border-radius: var(--radius-ctrl);
		cursor: pointer;
		font-size: 13px;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		text-decoration: none;
	}
	.btn:hover { background: var(--color-surface-2); }
	.btn-primary {
		background: var(--color-ink);
		color: var(--color-bg);
		border-color: var(--color-ink);
	}
	.btn-primary:hover { background: var(--color-ink-hover); }

	/* SVG icon size */
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

	/* modal backdrop */
	.modal::backdrop { background: rgba(0, 0, 0, 0.5); }
</style>
