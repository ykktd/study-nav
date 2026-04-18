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
	class="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border-[1.3px] border-hairline bg-transparent p-0 transition-all duration-150"
	class:done
	aria-label="完了"
	aria-pressed={done}
	onclick={toggle}
	type="button"
>
	<svg viewBox="0 0 12 12" aria-hidden="true" class="size-2.5 fill-none stroke-bg stroke-[2.4] [stroke-linecap:round] [stroke-linejoin:round]" class:hidden={!done}>
		<path d="m2.5 6 2.5 2.5 4.5-5" />
	</svg>
</button>

<style>
	button.done {
		background: var(--color-prog-high);
		border-color: var(--color-prog-high);
	}
	button:hover:not(.done) {
		border-color: var(--color-ink-3);
	}
</style>
