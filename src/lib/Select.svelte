<script lang="ts">
	import { clickOutside } from './utils.js'
	import Input from './Input.svelte'
	import Label from './Label.svelte'

	type Option = {
		value: any
		label: any
		[key: string]: any // Allow additional properties
	}

	type Props = {
		value?: string | number | undefined | null
		options: Option[]
		name?: string
		label?: string
		class?: string
		required?: boolean
		disabled?: boolean
	}
	let {
		value = $bindable(undefined),
		options: items,
		name,
		label,
		class: className = '',
		required = false,
		disabled = false,
	}: Props = $props()

	let detailsOpen = $state(false)

	let selectedItem = $derived.by(() => items.find((item) => item.value === value))

	let filter = $derived(selectedItem ? selectedItem.label : '')
	let filteredItems = $derived.by(() => {
		if (filter.length === 0) return items
		return items.filter((item) => item.label.toLowerCase().includes(filter.toLowerCase()))
	})

	let searchEL: HTMLInputElement | undefined = $state(undefined)
</script>

<!-- Important Hidden Input, This is the one that gets submitted -->
<input type="hidden" {name} value={value ?? ''} />

<Label {label} {name} {required} class={className}>
	{#if !disabled}
		<details
			class="dropdown"
			bind:open={detailsOpen}
			use:clickOutside={() => {
				filter = selectedItem?.label ?? ''
				detailsOpen = false
			}}>
			<summary
				class="select cursor-pointer bg-none pr-1"
				onclick={() => {
					searchEL?.focus()
					filter = ''
					if (!detailsOpen) detailsOpen = true
				}}>
				<input
					type="text"
					class="h-full w-full outline-0 {detailsOpen ? 'cursor-text' : 'cursor-pointer'}"
					bind:this={searchEL}
					bind:value={filter}
					placeholder={selectedItem ? selectedItem?.label : 'Select an item...'} />
				{#if !required && value}
					<button
						type="button"
						class="btn btn-sm btn-circle btn-ghost"
						onclick={(e) => {
							detailsOpen = false
							e.stopPropagation()
							value = undefined
							filter = ''
						}}>
						✕
					</button>
				{/if}
			</summary>

			<ul class="menu dropdown-content bg-base-100 rounded-box z-10 mt-2 flex w-full flex-col gap-1 p-2 shadow outline">
				{#if filteredItems.length == 0}
					<li class="m-2 text-center text-sm text-gray-500">No items found</li>
				{/if}
				{#each filteredItems as item (item.value)}
					{@const isSelected = item.value === value}
					<li>
						<button
							class="w-full {isSelected ? 'bg-primary text-primary-content' : ''} "
							type="button"
							onclick={() => {
								value = item.value
								filter = item.label
								detailsOpen = false
							}}>
							{item.label}
						</button>
					</li>
				{/each}
			</ul>
		</details>
	{:else}
		<Input
			type="text"
			class="h-full w-full outline-0"
			disabled
			value={selectedItem ? selectedItem.label : ''}
			readonly />
	{/if}
</Label>
