<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import CheckBox from '$lib/components/CheckBox.svelte';
	import type { PageData } from './$types';
	import type { Resource } from '$lib/types';
	import { toPreviewUrl, formatExamDate, daysUntil } from '$lib/types';

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
		// Google Drive links are previewable via /preview
		if (url.includes('drive.google.com')) return true;
		// Direct PDF links
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

<div class="detail-wrap">
	<!-- header -->
	<header class="detail-head">
		<div>
			<div class="crumbs">
				<a href="/">ダッシュボード</a>
				<span class="crumb-sep">/</span>
				<span class="cur">{subject.name}</span>
			</div>
			<div class="title-row">
				<h1>{subject.name}</h1>
			</div>
			<div class="meta-row">
				{#if subject.professor}
					<div><span class="mk">担当</span><span class="mv">{subject.professor}</span></div>
				{/if}
				{#if subject.day_period}
					<div><span class="mk">曜限</span><span class="mv mono">{subject.day_period}</span></div>
				{/if}
				{#if subject.exam_date}
					<div>
						<span class="mk">試験日</span><span class="mv mono"
							>{subject.exam_date}</span
						>
					</div>
					{#if examDays !== null}
						<div><span class="mk">あと</span><span class="mv mono">{examDays} 日</span></div>
					{/if}
				{/if}
			</div>
		</div>
		<div class="head-right">
			<div title="過去問 {pastExamDone}/{pastExamTotal} 完了">
				<ProgressRing done={pastExamDone} total={pastExamTotal} size={56} stroke={5} />
			</div>
			<div class="head-actions">
				<button class="btn btn-primary" type="button" onclick={() => openAddModal('past_exam')}>
					<span style="font-size:15px; line-height:1">＋</span>リンクを追加
				</button>
			</div>
		</div>
	</header>

	<!-- body -->
	<div class="body" class:preview-off={!previewOpen}>
		<!-- left: resource list -->
		<section class="resources">
			<!-- past exams -->
			{@render categorySection('past_exam', '過去問', pastExams)}
			<!-- lecture materials -->
			{@render categorySection('lecture', '講義資料', lectureRes)}
			<!-- other -->
			{@render categorySection('other', 'その他', otherRes)}
		</section>

		<!-- right: preview -->
		{#if previewOpen}
			<section class="preview-col">
				<div class="preview-bar">
					<div class="preview-meta">
						{#if selectedResource}
							<span class="preview-name">{selectedResource.name}</span>
						{:else}
							<span class="preview-name" style="color:var(--ink-3)">資料を選択してください</span>
						{/if}
					</div>
					<div class="preview-tools">
						{#if selectedResource}
							<a
								href={selectedResource.url}
								target="_blank"
								rel="noopener noreferrer"
								class="icon-btn"
								title="新しいタブで開く"
							>
								<svg class="i" viewBox="0 0 24 24"
									><path
										d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
									/></svg
								>
							</a>
						{/if}
						<button
							class="icon-btn"
							title="プレビューを閉じる"
							onclick={() => (previewOpen = false)}
						>
							<svg class="i" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6" /></svg>
						</button>
					</div>
				</div>
				<div class="preview-body">
					{#if selectedResource}
						{#if canPreview(selectedResource)}
							<iframe
								src={previewUrl(selectedResource)}
								title={selectedResource.name}
								sandbox="allow-same-origin allow-scripts allow-forms"
							></iframe>
						{:else}
							<div class="preview-empty">
								<div class="glyph">
									<svg
										style="width:22px;height:22px"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.6"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
										<path d="M14 3v6h6M9 13h6M9 17h4" />
									</svg>
								</div>
								<div class="empty-msg">このリンクはプレビューできません</div>
								<div class="empty-hint">外部サービスの資料は新しいタブで開いてください。</div>
								<a
									href={selectedResource.url}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-primary"
								>
									<svg
										class="i"
										viewBox="0 0 24 24"
										><path
											d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
										/></svg
									>
									新しいタブで開く
								</a>
							</div>
						{/if}
					{:else}
						<div class="preview-empty">
							<div class="glyph">
								<svg
									style="width:22px;height:22px"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
									<path d="M14 3v6h6M9 13h6M9 17h4" />
								</svg>
							</div>
							<div class="empty-msg">資料を選択してください</div>
							<div class="empty-hint">左のリストから資料をクリックするとプレビューが表示されます。</div>
						</div>
					{/if}
				</div>
			</section>
		{:else}
			<aside class="preview-rail">
				<button class="icon-btn" title="プレビューを開く" onclick={() => (previewOpen = true)}>
					<svg class="i" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg>
				</button>
				<div class="rail-label">Preview</div>
			</aside>
		{/if}
	</div>
</div>

<!-- Add resource modal -->
<dialog bind:this={modalRef} class="modal" onclose={closeModal}>
	<div class="modal-inner">
		<div class="modal-head">
			<h2>リンクを追加</h2>
			<button class="close-btn" onclick={closeModal} aria-label="閉じる">✕</button>
		</div>
		<form
			method="POST"
			action="?/addResource"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						closeModal();
					}
					await update({ reset: false });
					// Refresh resources from returned data
					resources = (data.resources as Resource[]).slice();
				};
			}}
		>
			<label>
				<span>名前 <span class="required">*</span></span>
				<input name="name" type="text" placeholder="例: 2024年度_期末試験_問題.pdf" required />
			</label>
			<label>
				<span>URL <span class="required">*</span></span>
				<input name="url" type="url" placeholder="https://..." required />
			</label>
			<label>
				<span>カテゴリ <span class="required">*</span></span>
				<select name="category">
					<option value="past_exam" selected={defaultCategory === 'past_exam'}>過去問</option>
					<option value="lecture" selected={defaultCategory === 'lecture'}>講義資料</option>
					<option value="other" selected={defaultCategory === 'other'}>その他</option>
				</select>
			</label>
			<div class="modal-actions">
				<button type="button" class="btn" onclick={closeModal}>キャンセル</button>
				<button type="submit" class="btn btn-primary">追加</button>
			</div>
		</form>
	</div>
</dialog>

{#snippet categorySection(cat: 'past_exam' | 'lecture' | 'other', label: string, items: Resource[])}
	<div class="category">
		<div class="cat-head">
			<div class="cat-title">
				{label}
				{#if cat === 'past_exam'}
					<span class="cat-count">{pastExamDone} / {pastExamTotal}</span>
				{:else}
					<span class="cat-count">{items.length}</span>
				{/if}
			</div>
			<button class="cat-add" type="button" onclick={() => openAddModal(cat)}>
				<span class="plus">＋</span>リンクを追加
			</button>
		</div>
		<div class="res-list">
			{#each items as item (item.id)}
				<div
					class="res-item"
					class:active={selectedResource?.id === item.id}
					onclick={() => selectResource(item)}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && selectResource(item)}
				>
					{#if cat === 'past_exam'}
						<CheckBox
							resourceId={item.id}
							bind:done={item.done}
						/>
					{:else}
						<span class="dot-ph"></span>
					{/if}
					<div class="res-main">
						<div class="res-name" class:striked={cat === 'past_exam' && item.done}>
							{item.name}
						</div>
						<div class="res-sub mono">{new URL(item.url).hostname}</div>
					</div>
					<div class="res-actions">
						<a
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
							class="icon-btn"
							title="新しいタブで開く"
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
			{/each}
			{#if items.length === 0}
				<div class="empty-cat">リンクがありません</div>
			{/if}
		</div>
	</div>
{/snippet}

<style>
	.detail-wrap {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	/* header */
	.detail-head {
		padding: 26px 40px 22px;
		border-bottom: 1px solid var(--hairline-soft);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 24px;
	}
	.crumbs {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12.5px;
		color: var(--ink-3);
		margin-bottom: 10px;
	}
	.crumbs a {
		color: var(--ink-3);
		text-decoration: none;
	}
	.crumbs a:hover {
		color: var(--ink);
	}
	.crumb-sep {
		color: var(--ink-4);
	}
	.cur {
		color: var(--ink);
		font-weight: 500;
	}
	.title-row {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	h1 {
		font-size: 24px;
		font-weight: 600;
		margin: 0;
		letter-spacing: -0.01em;
	}
	.meta-row {
		display: flex;
		gap: 18px;
		margin-top: 8px;
		color: var(--ink-3);
		font-size: 12.5px;
	}
	.mk {
		color: var(--ink-4);
		margin-right: 6px;
		letter-spacing: 0.04em;
	}
	.mv {
		color: var(--ink-2);
	}
	.head-right {
		display: flex;
		align-items: center;
		gap: 18px;
	}
	.head-actions {
		display: flex;
		gap: 8px;
	}

	/* body layout */
	.body {
		display: grid;
		grid-template-columns: minmax(340px, 420px) 1fr;
		flex: 1;
		min-height: 0;
		height: calc(100vh - 140px);
	}
	.body.preview-off {
		grid-template-columns: 1fr;
	}

	/* resource list */
	.resources {
		padding: 22px 28px 40px 40px;
		border-right: 1px solid var(--hairline-soft);
		overflow-y: auto;
	}
	.category {
		margin-top: 18px;
	}
	.category:first-child {
		margin-top: 0;
	}
	.cat-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
		padding: 0 4px;
	}
	.cat-title {
		font-size: 11.5px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.cat-count {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 10.5px;
		color: var(--ink-4);
		padding: 1px 6px;
		border-radius: 4px;
		background: var(--surface-2);
	}
	.cat-add {
		font: inherit;
		background: transparent;
		border: none;
		color: var(--ink-3);
		font-size: 12px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.cat-add:hover {
		color: var(--ink);
	}
	.plus {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 13px;
	}
	.res-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.res-item {
		display: grid;
		grid-template-columns: 20px 1fr auto;
		align-items: center;
		gap: 10px;
		padding: 9px 10px;
		border-radius: 8px;
		cursor: pointer;
		border: 1px solid transparent;
		position: relative;
	}
	.res-item:hover {
		background: var(--surface-1);
	}
	.res-item.active {
		background: var(--surface-2);
		border-color: var(--hairline-soft);
	}
	.res-item.active::before {
		content: '';
		position: absolute;
		left: -1px;
		top: 10px;
		bottom: 10px;
		width: 2px;
		background: var(--ink-2);
		border-radius: 2px;
	}
	.dot-ph {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--ink-4);
		justify-self: center;
	}
	.res-main {
		min-width: 0;
	}
	.res-name {
		font-size: 13.5px;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.res-name.striked {
		color: var(--ink-3);
		text-decoration: line-through;
		text-decoration-color: var(--ink-4);
	}
	.res-sub {
		font-size: 11.5px;
		color: var(--ink-4);
		margin-top: 2px;
	}
	.res-actions {
		display: flex;
		gap: 2px;
		opacity: 0;
		transition: 0.15s;
	}
	.res-item:hover .res-actions,
	.res-item.active .res-actions {
		opacity: 1;
	}
	.empty-cat {
		font-size: 12px;
		color: var(--ink-4);
		padding: 8px 10px;
	}

	/* preview */
	.preview-col {
		display: flex;
		flex-direction: column;
		background: var(--surface-1);
		min-height: 0;
		overflow: hidden;
	}
	.preview-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 20px;
		border-bottom: 1px solid var(--hairline-soft);
		background: var(--bg);
		flex-shrink: 0;
	}
	.preview-meta {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}
	.preview-name {
		font-size: 13.5px;
		color: var(--ink);
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.preview-tools {
		display: flex;
		gap: 6px;
		align-items: center;
		flex-shrink: 0;
	}
	.preview-body {
		flex: 1;
		position: relative;
		overflow: hidden;
	}
	.preview-body iframe {
		width: 100%;
		height: 100%;
		border: 0;
		background: white;
	}
	.preview-empty {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--ink-3);
		gap: 16px;
		padding: 32px;
	}
	.glyph {
		width: 56px;
		height: 56px;
		border-radius: 12px;
		border: 1px dashed var(--hairline);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--ink-3);
	}
	.empty-msg {
		font-size: 14px;
		color: var(--ink-2);
		text-align: center;
	}
	.empty-hint {
		font-size: 12px;
		color: var(--ink-4);
		text-align: center;
		max-width: 280px;
	}

	/* preview rail (closed) */
	.preview-rail {
		width: 44px;
		border-left: 1px solid var(--hairline-soft);
		background: var(--bg);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 14px 0;
	}
	.rail-label {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		margin-top: 16px;
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-4);
	}

	/* shared buttons */
	.btn {
		font: inherit;
		border: 1px solid var(--hairline);
		background: var(--surface-1);
		color: var(--ink);
		padding: 8px 13px;
		border-radius: var(--radius-ctrl);
		cursor: pointer;
		font-size: 13px;
		display: inline-flex;
		align-items: center;
		gap: 7px;
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
	.icon-btn {
		width: 28px;
		height: 28px;
		padding: 0;
		justify-content: center;
		border: 1px solid var(--hairline-soft);
		background: transparent;
		color: var(--ink-2);
		border-radius: 8px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		text-decoration: none;
	}
	.icon-btn:hover {
		background: var(--surface-1);
		color: var(--ink);
	}
	.i {
		width: 14px;
		height: 14px;
		stroke: currentColor;
		fill: none;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.i-sm {
		width: 12px;
		height: 12px;
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
		margin: auto;
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
		letter-spacing: 0.04em;
	}
	.required {
		color: var(--prog-low);
	}
	input[type='text'],
	input[type='url'],
	select {
		background: var(--surface-3);
		border: 1px solid var(--hairline-soft);
		border-radius: var(--radius-ctrl);
		color: var(--ink);
		padding: 9px 12px;
		font: inherit;
		font-size: 13.5px;
		outline: none;
	}
	input:focus,
	select:focus {
		border-color: var(--hairline);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 8px;
	}
</style>
