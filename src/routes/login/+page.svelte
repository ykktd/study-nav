<script lang="ts">
	import { supabase } from '$lib/supabase';

	let email = $state('');
	let sent = $state(false);
	let error = $state('');
	let loading = $state(false);

	async function sendMagicLink() {
		if (!email) return;
		loading = true;
		error = '';
		const { error: err } = await supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: `${location.origin}/auth/callback` }
		});
		loading = false;
		if (err) {
			error = err.message;
		} else {
			sent = true;
		}
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

		{#if sent}
			<div class="sent">
				<p>✉ <strong>{email}</strong> にログインリンクを送信しました。</p>
				<p class="hint">メールのリンクをクリックするとログインできます。</p>
			</div>
		{:else}
			<h1>ログイン</h1>
			<p class="sub">メールアドレスを入力してください。マジックリンクを送信します。</p>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); sendMagicLink(); }}>
				<label>
					<span>メールアドレス</span>
					<input
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						required
					/>
				</label>
				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? '送信中...' : 'リンクを送信'}
				</button>
			</form>
		{/if}
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
		color: var(--ink-3);
		font-weight: 400;
	}
	h1 {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 8px;
		color: var(--ink);
	}
	.sub {
		color: var(--ink-3);
		font-size: 13.5px;
		margin: 0 0 24px;
	}
	.error {
		color: var(--prog-low);
		font-size: 13px;
		margin-bottom: 12px;
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
	.sent {
		color: var(--ink-2);
		font-size: 13.5px;
		line-height: 1.6;
	}
	.hint {
		color: var(--ink-4);
		font-size: 12.5px;
		margin-top: 8px;
	}
</style>
