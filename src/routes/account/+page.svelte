<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const user = $derived(data.user);
	const initials = $derived(user?.email ? user.email[0].toUpperCase() : '?');
	const provider = $derived(
		user?.app_metadata?.provider === 'google' ? 'Google' : 'メール'
	);
	const driveConnected = $derived(data.driveConnected);

	let loading = $state(false);
	let driveLoading = $state(false);

	async function signOut() {
		loading = true;
		await supabase.auth.signOut();
		goto('/login');
	}

	async function connectDrive() {
		driveLoading = true;
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${location.origin}/auth/callback?next=/account&drive=1`,
				scopes: 'https://www.googleapis.com/auth/drive.readonly'
			}
		});
		if (error) driveLoading = false;
	}
</script>

<svelte:head>
	<title>study-nav — アカウント</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-bg">
	<div class="w-full max-w-95 rounded-2xl border border-hairline-soft bg-surface-1 px-9 py-10">
		<div class="mb-8 flex items-center gap-2.5">
			<div
				class="size-6.5 shrink-0 rounded-[7px]"
				aria-hidden="true"
				style="background: conic-gradient(from 210deg at 50% 50%, var(--color-prog-low), var(--color-prog-mid), var(--color-prog-high), var(--color-prog-low)); mask: radial-gradient(circle at 50% 50%, transparent 5px, #000 6px); -webkit-mask: radial-gradient(circle at 50% 50%, transparent 5px, #000 6px);"
			></div>
			<div class="text-[15px] font-semibold text-ink">
				study<span class="font-semibold text-ink">-nav</span>
			</div>
		</div>

		<h1 class="m-0 mb-6 text-[20px] font-semibold text-ink">アカウント</h1>

		<div class="mb-6 flex items-center gap-4">
			<div class="flex size-12 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-2 text-[18px] font-semibold text-ink-3">
				{initials}
			</div>
			<div class="flex flex-col gap-0.5">
				<div class="text-[14px] font-medium text-ink">{user?.email}</div>
				<div class="text-[12.5px] text-ink-4">{provider}でログイン中</div>
			</div>
		</div>

		<div class="mb-6 rounded-xl border border-hairline-soft bg-surface-2 px-4 py-3.5">
			<div class="mb-2.5 flex items-center justify-between">
				<div class="text-[13px] font-medium text-ink">Googleドライブ連携</div>
				{#if driveConnected}
					<span class="text-[11.5px] text-prog-high">接続済み</span>
				{:else}
					<span class="text-[11.5px] text-ink-4">未接続</span>
				{/if}
			</div>
			<p class="mb-3 text-[12px] text-ink-4">
				{#if driveConnected}
					DriveのURLを登録する際にファイル名が自動入力されます。
				{:else}
					接続するとDriveのURLを登録する際にファイル名が自動入力されます。
				{/if}
			</p>
			<button
				type="button"
				onclick={connectDrive}
				disabled={driveLoading}
				class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-ctrl border border-hairline-soft bg-surface-1 px-3.5 py-2 font-[inherit] text-[13px] font-medium text-ink-2 hover:border-hairline hover:bg-bg disabled:cursor-not-allowed disabled:opacity-60"
			>
				<svg class="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				{driveLoading ? '接続中...' : driveConnected ? 'Driveを再接続' : 'Googleドライブと連携'}
			</button>
		</div>

		<div class="border-t border-hairline-soft pt-6">
			<button
				type="button"
				onclick={signOut}
				disabled={loading}
				class="flex w-full cursor-pointer items-center justify-center rounded-ctrl border border-hairline-soft bg-surface-2 px-3.5 py-2.5 font-[inherit] text-[13.5px] font-medium text-ink-2 hover:border-hairline hover:bg-surface-1 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loading ? 'ログアウト中...' : 'ログアウト'}
			</button>
		</div>
	</div>
</div>
