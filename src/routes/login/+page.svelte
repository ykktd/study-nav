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
			const { error: err } = await supabase.auth.signUp({ email, password });
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

<div class="login-shell">
	<div class="login-card">
		<div class="brand">
			<div class="brand-mark" aria-hidden="true"></div>
			<div class="brand-name">study<span class="accent">-nav</span></div>
		</div>

		<h1>{mode === 'signin' ? 'ログイン' : 'アカウント作成'}</h1>

		{#if error}
			<p class="error">{error}</p>
		{/if}
		{#if message}
			<p class="message">{message}</p>
		{/if}

		<button type="button" class="btn-google" onclick={signInWithGoogle} disabled={loading}>
			<svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
				<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
			Googleでログイン
		</button>

		<div class="divider"><span>または</span></div>

		<form onsubmit={(e) => { e.preventDefault(); submitEmailPassword(); }}>
			<label>
				<span>メールアドレス</span>
				<input
					type="email"
					bind:value={email}
					placeholder="you@example.com"
					required
				/>
			</label>
			<label>
				<span>パスワード</span>
				<input
					type="password"
					bind:value={password}
					placeholder="••••••••"
					required
				/>
			</label>
			<button type="submit" class="btn-primary" disabled={loading}>
				{#if loading}
					処理中...
				{:else if mode === 'signin'}
					ログイン
				{:else}
					アカウント作成
				{/if}
			</button>
		</form>

		<p class="toggle">
			{#if mode === 'signin'}
				アカウントをお持ちでない方は
				<button type="button" class="link" onclick={() => { mode = 'signup'; error = ''; message = ''; }}>
					新規登録
				</button>
			{:else}
				すでにアカウントをお持ちの方は
				<button type="button" class="link" onclick={() => { mode = 'signin'; error = ''; message = ''; }}>
					ログイン
				</button>
			{/if}
		</p>
	</div>
</div>

<style>
	.login-shell {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: var(--bg);
	}
	.login-card {
		width: 100%;
		max-width: 380px;
		padding: 40px 36px;
		background: var(--surface-1);
		border: 1px solid var(--hairline-soft);
		border-radius: 16px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 32px;
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
		font-size: 15px;
		color: var(--ink);
	}
	.accent {
		color: var(--ink);
		font-weight: 600;
	}
	h1 {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 20px;
		color: var(--ink);
	}
	.error {
		color: var(--prog-low);
		font-size: 13px;
		margin-bottom: 12px;
	}
	.message {
		color: var(--ink-3);
		font-size: 13px;
		margin-bottom: 12px;
	}
	.btn-google {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		background: var(--surface-2);
		color: var(--ink);
		border: 1px solid var(--hairline-soft);
		border-radius: var(--radius-ctrl);
		padding: 10px 14px;
		font: inherit;
		font-size: 13.5px;
		cursor: pointer;
		font-weight: 500;
	}
	.btn-google:hover:not(:disabled) {
		border-color: var(--hairline);
		background: var(--surface-1);
	}
	.btn-google:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.google-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
	.divider {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 18px 0;
		color: var(--ink-4);
		font-size: 12px;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--hairline-soft);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 12.5px;
		color: var(--ink-3);
	}
	input {
		background: var(--surface-2);
		border: 1px solid var(--hairline-soft);
		border-radius: var(--radius-ctrl);
		color: var(--ink);
		padding: 10px 12px;
		font: inherit;
		font-size: 13.5px;
		outline: none;
	}
	input:focus {
		border-color: var(--hairline);
	}
	.btn-primary {
		background: var(--ink);
		color: var(--bg);
		border: 1px solid var(--ink);
		border-radius: var(--radius-ctrl);
		padding: 10px 14px;
		font: inherit;
		font-size: 13.5px;
		cursor: pointer;
		font-weight: 500;
	}
	.btn-primary:hover:not(:disabled) {
		background: oklch(0.88 0.005 250);
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.toggle {
		margin-top: 16px;
		font-size: 12.5px;
		color: var(--ink-4);
		text-align: center;
	}
	.link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		font-size: inherit;
		color: var(--ink-2);
		cursor: pointer;
		text-decoration: underline;
	}
	.link:hover {
		color: var(--ink);
	}
</style>
