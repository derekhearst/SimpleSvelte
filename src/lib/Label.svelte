<script lang="ts">
	import type { Snippet } from 'svelte'
	type Props = {
		class?: string
		label: string | undefined
		name?: string
		optional?: boolean
		disabled?: boolean
		children?: Snippet
	}

	let { class: className = '', name = '', optional = false, label, disabled, children }: Props = $props()
</script>

{#if label}
	<label class="flex w-full flex-col {className}" for={name}>
		<div class="label mb-1 p-0 text-sm">
			<span class="">{label}</span>
			{#if optional && !disabled}
				<span class="label">(Optional)</span>
			{/if}
		</div>
		{@render children?.()}
	</label>
{:else}
	{@render children?.()}
{/if}
