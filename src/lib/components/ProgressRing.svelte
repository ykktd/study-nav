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
	class="relative shrink-0"
	data-state={state}
	style="width:{size}px; height:{size}px"
>
	<svg viewBox="0 0 {size} {size}" class="w-full h-full" style="transform:rotate(-90deg)">
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
	<div class="mono absolute inset-0 flex flex-col items-center justify-center leading-none">
		<span class="text-[12.5px] text-ink tracking-[0.02em]">{label}</span>
		<span class="text-[9px] text-ink-4 mt-0.75 tracking-[0.05em]">{pctLabel}</span>
	</div>
</div>

<style>
	/* SVG stroke cannot be set via Tailwind utilities */
	.track {
		stroke: var(--color-track);
	}
	.bar {
		stroke-linecap: round;
		transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;
	}
	[data-state='low'] .bar  { stroke: var(--color-prog-low); }
	[data-state='mid'] .bar  { stroke: var(--color-prog-mid); }
	[data-state='high'] .bar { stroke: var(--color-prog-high); }
	[data-state='done'] .bar { stroke: var(--color-prog-high); }
</style>
