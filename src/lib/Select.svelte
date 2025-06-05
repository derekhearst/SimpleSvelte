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
		value?: string | number | undefined | null | (string | number)[]
		options: Option[]
		name?: string
		label?: string
		class?: string
		required?: boolean
		disabled?: boolean
		multiple?: boolean
		onchange?: (value: string | number | undefined | null | (string | number)[]) => void
	}

	let {
		value = $bindable(undefined),
		options: items,
		name,
		label,
		class: className = '',
		required = false,
		disabled = false,
		multiple = false,
		onchange,
	}: Props = $props()

	let detailsOpen = $state(false)

	$effect(() => {
		if (onchange) onchange(value)
	})

	// Initialize value as array for multiple mode, ensure it's always an array when multiple
	$effect(() => {
		if (multiple && !Array.isArray(value)) {
			value = value ? [value] : []
		} else if (!multiple && Array.isArray(value)) {
			value = value.length > 0 ? value[0] : undefined
		}
	})

	// For single select mode
	let selectedItem = $derived.by(() => {
		if (multiple) return null
		return items.find((item) => item.value === value)
	})
	// For multi select mode
	let selectedItems = $derived.by(() => {
		if (!multiple || !Array.isArray(value)) return []
		return items.filter((item) => (value as (string | number)[]).includes(item.value))
	})

	// Check if an item is selected in multi-select mode
	function isItemSelected(itemValue: any): boolean {
		if (!multiple) return itemValue === value
		return Array.isArray(value) && value.includes(itemValue)
	}

	// Toggle item selection in multi-select mode
	function toggleItemSelection(itemValue: any) {
		if (!multiple) {
			value = itemValue
			filter = items.find((item) => item.value === itemValue)?.label || ''
			detailsOpen = false
			return
		}

		if (!Array.isArray(value)) {
			value = [itemValue]
		} else if (value.includes(itemValue)) {
			value = value.filter((v) => v !== itemValue)
		} else {
			value = [...value, itemValue]
		}
	}

	// Remove specific item from multi-select
	function removeSelectedItem(itemValue: any) {
		if (Array.isArray(value)) {
			value = value.filter((v) => v !== itemValue)
		}
	}

	// Clear all selections
	function clearAll() {
		value = multiple ? [] : undefined
		filter = ''
		detailsOpen = false
	}
	let filter = $derived.by(() => {
		if (multiple) return ''
		return selectedItem ? selectedItem.label : ''
	})

	let filteredItems = $derived.by(() => {
		if (filter.length === 0) return items
		return items.filter((item) => item.label.toLowerCase().includes(filter.toLowerCase()))
	})
	// Display text for the input placeholder/value
	let displayText = $derived.by(() => {
		if (multiple) {
			const count = selectedItems.length
			if (count === 0) return 'Select items...'
			if (count === 1) return selectedItems[0].label
			return `${count} items selected`
		}
		return selectedItem ? selectedItem.label : 'Select an item...'
	})
	let searchEL: HTMLInputElement | undefined = $state(undefined)

	// Virtual list implementation
	let scrollContainer: HTMLDivElement | undefined = $state(undefined)
	let scrollTop = $state(0)
	const itemHeight = 40 // Approximate height of each item in pixels
	const containerHeight = 320 // max-h-80 = 320px
	const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 // Add buffer items

	// Calculate visible items based on scroll position
	let visibleItems = $derived.by(() => {
		const startIndex = Math.floor(scrollTop / itemHeight)
		const endIndex = Math.min(startIndex + visibleCount, filteredItems.length)
		return {
			startIndex: Math.max(0, startIndex),
			endIndex,
			items: filteredItems.slice(Math.max(0, startIndex), endIndex),
		}
	})

	// Handle scroll events
	function handleScroll(e: Event) {
		const target = e.target as HTMLDivElement
		scrollTop = target.scrollTop
	}
</script>

<!-- Data inputs for form submission -->
{#if multiple && Array.isArray(value)}
	{#each value as val}
		<input type="hidden" {name} value={val} />
	{/each}
{:else if !multiple && value !== undefined && value !== null && value !== ''}
	<input type="hidden" {name} {value} />
{/if}

<Label {label} {name} {required} class={className}>
	{#if !disabled}
		<details
			class="dropdown w-full"
			bind:open={detailsOpen}
			use:clickOutside={() => {
				if (!detailsOpen) return
				if (!multiple) {
					filter = selectedItem?.label ?? ''
				} else {
					filter = ''
				}
				console.log('clickOutside')
				detailsOpen = false
			}}>
			<summary
				class="select h-max min-h-10 w-full min-w-12 cursor-pointer !bg-none pr-1"
				onclick={() => {
					searchEL?.focus()
					filter = ''
				}}>
				{#if multiple}
					<!-- Multi-select display with chips -->
					<div class="flex min-h-8 flex-wrap gap-1 p-1">
						{#each selectedItems as item (item.value)}
							<div class="badge !badge-primary gap-1">
								<span class="truncate">{item.label}</span>
								<button
									type="button"
									class="btn btn-xs btn-circle btn-ghost"
									onclick={(e) => {
										e.stopPropagation()
										removeSelectedItem(item.value)
									}}>
									✕
								</button>
							</div>
						{/each}
						<!-- Search input for filtering in multi-select -->
						<input
							type="text"
							class="h-full outline-0 {detailsOpen ? 'cursor-text' : 'cursor-pointer'}"
							bind:this={searchEL}
							bind:value={filter}
							onclick={(e) => {
								detailsOpen = true
							}}
							placeholder={'Search...'}
							required={required && (!Array.isArray(value) || value.length === 0)} />
					</div>
				{:else}
					<!-- Single-select display -->
					<input
						type="text"
						class="h-full w-full outline-0 {detailsOpen ? 'cursor-text' : 'cursor-pointer'}"
						bind:this={searchEL}
						bind:value={filter}
						onclick={(e) => {
							detailsOpen = true
						}}
						placeholder={displayText}
						required={required && !value} />
				{/if}

				{#if !required && ((multiple && Array.isArray(value) && value.length > 0) || (!multiple && value))}
					<button
						type="button"
						class="btn btn-sm btn-circle btn-ghost absolute top-1 right-1"
						onclick={(e) => {
							e.stopPropagation()
							clearAll()
						}}>
						✕
					</button>
				{/if}
			</summary>
			<ul
				class="menu dropdown-content bg-base-100 rounded-box z-10 mt-2 flex w-full flex-col flex-nowrap gap-1 p-2 shadow outline">
				{#if multiple && filteredItems.length > 1}
					<!-- Select All / Clear All options for multi-select -->

					<div class="flex gap-2">
						<button
							type="button"
							class="btn btn-sm hover:bg-base-content/10 grow"
							onclick={() => {
								const allValues = filteredItems.map((item) => item.value)
								value = [...allValues]
							}}>
							Select All
						</button>
						<button
							type="button"
							class="btn btn-sm hover:bg-base-content/10 grow"
							onclick={() => {
								value = []
							}}>
							Clear All
						</button>
					</div>
				{/if}
				{#if filteredItems.length === 0}
					<li class="m-2 text-center text-sm text-gray-500">No items found</li>
				{/if}

				{#if filteredItems.length > 0}
					<div class="relative max-h-80 overflow-y-auto" bind:this={scrollContainer} onscroll={handleScroll}>
						<!-- Virtual spacer for items before visible range -->
						{#if visibleItems.startIndex > 0}
							<div style="height: {visibleItems.startIndex * itemHeight}px;"></div>
						{/if}

						<!-- Render only visible items -->
						{#each visibleItems.items as item, index (item.value)}
							{@const isSelected = isItemSelected(item.value)}
							<li style="height: {itemHeight}px;">
								<button
									class="flex h-full w-full items-center gap-2 {isSelected ? 'bg-primary text-primary-content' : ''}"
									type="button"
									onclick={() => {
										toggleItemSelection(item.value)
										searchEL?.focus()
									}}>
									{#if multiple}
										<!-- Checkbox for multi-select -->
										<input
											type="checkbox"
											class="checkbox checkbox-sm !text-primary-content pointer-events-none"
											checked={isSelected}
											readonly />
									{/if}

									<span class="flex-1 text-left">{item.label}</span>
								</button>
							</li>
						{/each}

						<!-- Virtual spacer for items after visible range -->
						{#if visibleItems.endIndex < filteredItems.length}
							<div style="height: {(filteredItems.length - visibleItems.endIndex) * itemHeight}px;"></div>
						{/if}
					</div>
				{/if}
			</ul>
		</details>
	{:else}
		<!-- Disabled state -->
		{#if multiple}
			<div class="flex min-h-12 flex-wrap gap-1 p-2">
				{#each selectedItems as item (item.value)}
					<div class="badge badge-ghost">{item.label}</div>
				{/each}
				{#if selectedItems.length === 0}
					<span class="text-gray-500">No items selected</span>
				{/if}
			</div>
		{:else}
			<Input
				type="text"
				class="h-full w-full outline-0"
				disabled
				value={selectedItem ? selectedItem.label : ''}
				readonly />
		{/if}
	{/if}
</Label>
