<script lang="ts">
	import { supabase } from '$lib/supabase';

	interface Props {
		resourceId: string;
		done: boolean;
		onToggle?: (done: boolean) => void;
	}

	let { resourceId, done = $bindable(), onToggle }: Props = $props();

	async function toggle(e: MouseEvent) {
		e.stopPropagation();
		const prev = done;
		done = !done;
		onToggle?.(done);
		const { error } = await supabase
			.from('resources')
			.update({ done })
			.eq('id', resourceId);
		if (error) {
			done = prev;
			onToggle?.(prev);
		}
	}
</script>

<button
	class="chk"
	class:done
	aria-label="完了"
	aria-pressed={done}
	onclick={toggle}
	type="button"
>
	<svg viewBox="0 0 12 12" aria-hidden="true">
		<path d="m2.5 6 2.5 2.5 4.5-5" />
	</svg>
</button>

<style>
	.chk {
		width: 16px;
		height: 16px;
		border-radius: 4px;
		border: 1.3px solid var(--hairline);
		background: transparent;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
		transition: 0.15s;
		padding: 0;
	}
	.chk:hover {
		border-color: var(--ink-3);
	}
	.chk.done {
		background: var(--prog-high);
		border-color: var(--prog-high);
	}
	.chk svg {
		display: none;
		width: 10px;
		height: 10px;
		stroke: var(--bg);
		stroke-width: 2.4;
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.chk.done svg {
		display: block;
	}
</style>
