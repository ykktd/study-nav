<script lang="ts">
	import { progressState } from '$lib/types';

	interface Props {
		done: number;
		total: number;
		size?: number;
		stroke?: number;
	}

	let { done, total, size = 58, stroke = 6 }: Props = $props();

	const r = $derived(size / 2 - stroke / 2 - 1);
	const c = $derived(2 * Math.PI * r);
	const pct = $derived(total > 0 ? done / total : 0);
	const offset = $derived(c * (1 - pct));
	const state = $derived(progressState(done, total));
	const label = $derived(`${done}/${total}`);
	const pctLabel = $derived(`${Math.round(pct * 100)}%`);
	const cx = $derived(size / 2);
</script>

<div
	class="ring"
	data-state={state}
	style="--size:{size}px; --stroke:{stroke}px"
>
	<svg viewBox="0 0 {size} {size}" style="transform:rotate(-90deg)">
		<circle class="track" cx={cx} cy={cx} r={r} fill="none" stroke-width={stroke} />
		<circle
			class="bar"
			cx={cx}
			cy={cx}
			r={r}
			fill="none"
			stroke-width={stroke}
			stroke-dasharray={c.toFixed(2)}
			stroke-dashoffset={offset.toFixed(2)}
		/>
	</svg>
	<div class="ring-label mono">
		<span class="frac">{label}</span>
		<span class="pct">{pctLabel}</span>
	</div>
</div>

<style>
	.ring {
		width: var(--size);
		height: var(--size);
		position: relative;
		flex-shrink: 0;
	}
	.ring svg {
		width: 100%;
		height: 100%;
	}
	.track {
		stroke: var(--track);
	}
	.bar {
		stroke-linecap: round;
		transition:
			stroke-dashoffset 0.6s ease,
			stroke 0.3s ease;
	}
	.ring[data-state='low'] .bar {
		stroke: var(--prog-low);
	}
	.ring[data-state='mid'] .bar {
		stroke: var(--prog-mid);
	}
	.ring[data-state='high'] .bar {
		stroke: var(--prog-high);
	}
	.ring[data-state='done'] .bar {
		stroke: var(--prog-high);
	}
	.ring-label {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}
	.frac {
		font-size: 12.5px;
		color: var(--ink);
		letter-spacing: 0.02em;
	}
	.pct {
		font-size: 9px;
		color: var(--ink-4);
		margin-top: 3px;
		letter-spacing: 0.05em;
	}
</style>
