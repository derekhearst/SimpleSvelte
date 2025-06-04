<script lang="ts">
	import type { Snippet } from 'svelte'

	let { open = $bindable(), title, children }: Props = $props()

	let dialogEl: HTMLDialogElement | undefined = $state()
	interface Props {
		open: boolean
		title: string
		children?: Snippet
	}

	$effect(() => {
		if (open) {
			dialogEl?.showModal()
		} else {
			dialogEl?.close()
		}
	})
</script>

<dialog bind:this={dialogEl} onclose={() => (open = false)} class="modal modal-middle overflow-auto">
	<div class="modal-box max-w-max min-w-[32rem] pt-12">
		<form method="dialog">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
				onclick={() => {
					open = false
				}}>✕</button>
		</form>
		<h1 class="absolute top-2 text-lg font-semibold text-red-700 uppercase">{title}</h1>

		{#if open}
			{@render children?.()}
		{/if}
	</div>
</dialog>
