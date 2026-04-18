<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { supabase } from '$lib/supabase';

	let mode = $state<'signin' | 'signup'>('signin');
	let email = $state('');
	let password = $state('');
	let message = $state('');
	let error = $state(page.url.searchParams.get('error') ?? '');
	let loading = $state(false);

	async function signInWithGoogle() {
		loading = true;
		error = '';
		const { error: err } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: `${location.origin}/auth/callback` }
		});
		if (err) {
			error = err.message;
			loading = false;
		}
	}

	async function submitEmailPassword() {
		if (!email || !password) return;
		loading = true;
		error = '';
		message = '';

		if (mode === 'signup') {
			const { error: err } = await supabase.auth.signUp({
				email,
				password,
				options: { emailRedirectTo: `${location.origin}/auth/callback` }
			});
			if (err) {
				error = err.message;
			} else {
				message = '確認メールを送信しました。メールのリンクをクリックしてください。';
			}
		} else {
			const { error: err } = await supabase.auth.signInWithPassword({ email, password });
			if (err) {
				error = err.message;
			} else {
				goto('/');
			}
		}
		loading = false;
	}
</script>

<svelte:head>
	<title>study-nav — ログイン</title>
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

		<h1 class="m-0 mb-5 text-[20px] font-semibold text-ink">
			{mode === 'signin' ? 'ログイン' : 'アカウント作成'}
		</h1>

		{#if error}
			<p class="mb-3 text-[13px] text-prog-low">{error}</p>
		{/if}
		{#if message}
			<p class="mb-3 text-[13px] text-ink-3">{message}</p>
		{/if}

		<button
			type="button"
			class="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-ctrl border border-hairline-soft bg-surface-2 px-3.5 py-2.5 font-[inherit] text-[13.5px] font-medium text-ink hover:border-hairline hover:bg-surface-1 disabled:cursor-not-allowed disabled:opacity-60"
			onclick={signInWithGoogle}
			disabled={loading}
		>
			<svg class="size-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
				<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
			Googleでログイン
		</button>

		<div class="my-4.5 flex items-center gap-3 text-[12px] text-ink-4 before:h-px before:flex-1 before:bg-hairline-soft before:content-[''] after:h-px after:flex-1 after:bg-hairline-soft after:content-['']">
			<span>または</span>
		</div>

		<form class="flex flex-col gap-3.5" onsubmit={(e) => { e.preventDefault(); submitEmailPassword(); }}>
			<label class="flex flex-col gap-1.5 text-[12.5px] text-ink-3">
				<span>メールアドレス</span>
				<input
					type="email"
					bind:value={email}
					placeholder="you@example.com"
					required
					class="rounded-ctrl border border-hairline-soft bg-surface-2 px-3 py-2.5 font-[inherit] text-[13.5px] text-ink outline-none focus:border-hairline"
				/>
			</label>
			<label class="flex flex-col gap-1.5 text-[12.5px] text-ink-3">
				<span>パスワード</span>
				<input
					type="password"
					bind:value={password}
					placeholder="••••••••"
					required
					class="rounded-ctrl border border-hairline-soft bg-surface-2 px-3 py-2.5 font-[inherit] text-[13.5px] text-ink outline-none focus:border-hairline"
				/>
			</label>
			<button
				type="submit"
				disabled={loading}
				class="rounded-ctrl border border-ink bg-ink px-3.5 py-2.5 font-[inherit] text-[13.5px] font-medium text-bg hover:bg-ink-hover disabled:cursor-not-allowed disabled:opacity-60"
			>
				{#if loading}
					処理中...
				{:else if mode === 'signin'}
					ログイン
				{:else}
					アカウント作成
				{/if}
			</button>
		</form>

		<p class="mt-4 text-center text-[12.5px] text-ink-4">
			{#if mode === 'signin'}
				アカウントをお持ちでない方は
				<button
					type="button"
					class="cursor-pointer border-none bg-none p-0 font-[inherit] text-[12.5px] text-ink-2 underline hover:text-ink"
					onclick={() => { mode = 'signup'; error = ''; message = ''; }}
				>
					新規登録
				</button>
			{:else}
				すでにアカウントをお持ちの方は
				<button
					type="button"
					class="cursor-pointer border-none bg-none p-0 font-[inherit] text-[12.5px] text-ink-2 underline hover:text-ink"
					onclick={() => { mode = 'signin'; error = ''; message = ''; }}
				>
					ログイン
				</button>
			{/if}
		</p>
	</div>
</div>
