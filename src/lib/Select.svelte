<script lang="ts">
	import { clickOutside } from './utils.js'
	import Input from './Input.svelte'
	import Label from './Label.svelte'
	import { tick } from 'svelte'
	type Option = {
		value: any
		label: any
		group?: string
		[key: string]: any // Allow additional properties
	}

	type Props = {
		value?: string | number | undefined | null | (string | number)[]
		options: Option[]
		name?: string
		label?: string
		class?: string
		required?: boolean
		placeholder?: string
		disabled?: boolean
		multiple?: boolean
		error?: string
		zodErrors?: {
			expected: string
			code: string
			path: string[]
			message: string
		}[]
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
		placeholder = 'Select an item...',
		error,
		zodErrors,
		onchange,
	}: Props = $props()

	let detailsOpen = $state(false)

	// Initialize value as array for multiple mode, ensure it's always an array when multiple
	// Use derived to avoid timing issues with effects
	let normalizedValue = $derived.by(() => {
		if (multiple && !Array.isArray(value)) {
			return value ? [value] : []
		} else if (!multiple && Array.isArray(value)) {
			return value.length > 0 ? value[0] : undefined
		}
		return value
	})

	// Sync normalized value back to value prop when it differs
	$effect(() => {
		if (normalizedValue !== value) {
			value = normalizedValue
		}
	})

	// For single select mode
	let selectedItem = $derived.by(() => {
		if (multiple) return null
		const currentValue = normalizedValue
		return items.find((item) => item.value === currentValue)
	})
	// For multi select mode
	let selectedItems = $derived.by(() => {
		if (!multiple) return []
		const currentValue = normalizedValue
		if (!Array.isArray(currentValue)) return []
		return items.filter((item) => currentValue.includes(item.value))
	})

	// Check if an item is selected in multi-select mode
	function isItemSelected(itemValue: any): boolean {
		if (!multiple) return itemValue === normalizedValue
		const currentValue = normalizedValue
		return Array.isArray(currentValue) && currentValue.includes(itemValue)
	}

	// Toggle item selection in multi-select mode
	async function toggleItemSelection(itemValue: any) {
		if (!multiple) {
			// Close dropdown and update filter immediately
			filter = items.find((item) => item.value === itemValue)?.label || ''
			detailsOpen = false
			filterMode = 'auto'

			// Wait for DOM update so details closes properly
			await tick()

			// Update value and call onchange - these happen synchronously
			// even though we're in an async function
			value = itemValue
			if (onchange) onchange(value)
			return
		}

		// For multiple selection, work with current array state
		const currentValue = Array.isArray(normalizedValue) ? normalizedValue : []

		if (currentValue.includes(itemValue)) {
			value = currentValue.filter((v) => v !== itemValue)
		} else {
			value = [...currentValue, itemValue]
		}
		if (onchange) onchange(value)
	}

	// Remove specific item from multi-select
	function removeSelectedItem(itemValue: any) {
		const currentValue = normalizedValue
		if (Array.isArray(currentValue)) {
			value = currentValue.filter((v) => v !== itemValue)
			if (onchange) onchange(value)
		}
	}

	// Clear all selections
	function clearAll() {
		value = multiple ? [] : null
		filter = ''
		detailsOpen = false
		if (onchange) onchange(value)
	}

	let filter = $state('')
	let filterMode = $state<'user' | 'auto'>('user') // Track if filter is user-controlled or auto-synced

	// Auto-sync filter for single select when not user-controlled
	$effect(() => {
		if (!multiple && !detailsOpen && filterMode === 'auto') {
			if (selectedItem) {
				filter = selectedItem.label
			} else {
				filter = ''
			}
		}
	})

	// Reset filter mode when user starts typing
	function handleFilterInput() {
		filterMode = 'user'
	}

	// Set filter mode to auto when closing dropdown
	function handleDropdownClose() {
		if (!multiple) {
			filterMode = 'auto'
		}
	}

	let filteredItems = $derived.by(() => {
		if (filter.length === 0) return items
		return items.filter((item) => item.label.toLowerCase().includes(filter.toLowerCase()))
	})

	// Flatten filteredItems into a list with group headers and options for virtual scroll
	type FlatListItem = { type: 'header'; group: string } | { type: 'option'; item: Option }
	let flatList = $derived.by(() => {
		const result: FlatListItem[] = []
		const groups: Record<string, Option[]> = {}
		const ungrouped: Option[] = []
		for (const item of filteredItems) {
			if (item.group) {
				if (!groups[item.group]) groups[item.group] = []
				groups[item.group].push(item)
			} else {
				ungrouped.push(item)
			}
		}
		// Add ungrouped items first
		for (const item of ungrouped) {
			result.push({ type: 'option', item })
		}
		// Add grouped items with headers
		for (const groupName of Object.keys(groups)) {
			result.push({ type: 'header', group: groupName })
			for (const item of groups[groupName]) {
				result.push({ type: 'option', item })
			}
		}
		return result
	})
	// Display text for the input placeholder/value
	let displayText = $derived.by(() => {
		if (multiple) {
			const count = selectedItems.length
			if (count === 0) return placeholder
			if (count === 1) return selectedItems[0].label
			return `${count} items selected`
		}
		return selectedItem ? selectedItem.label : placeholder
	})
	let searchEL: HTMLInputElement | undefined = $state(undefined)

	// Virtual list implementation
	let scrollContainer: HTMLDivElement | undefined = $state(undefined)
	let scrollTop = $state(0)
	const itemHeight = 40 // Approximate height of each item in pixels
	const containerHeight = 320 // max-h-80 = 320px
	const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 // Add buffer items

	// Calculate visible items based on scroll position (for flatList)
	let visibleItems = $derived.by(() => {
		const total = flatList.length
		const totalHeight = total * itemHeight

		// If content is shorter than container, show everything from start
		if (totalHeight <= containerHeight) {
			return {
				startIndex: 0,
				endIndex: total,
				items: flatList,
				total,
			}
		}

		const startIndex = Math.floor(scrollTop / itemHeight)
		const endIndex = Math.min(startIndex + visibleCount, total)
		return {
			startIndex: Math.max(0, startIndex),
			endIndex,
			items: flatList.slice(Math.max(0, startIndex), endIndex),
			total,
		}
	}) // Handle scroll events
	function handleScroll(e: Event) {
		const target = e.target as HTMLDivElement
		scrollTop = target.scrollTop
	}

	// Scroll to selected item when dropdown opens
	$effect(() => {
		if (detailsOpen && scrollContainer) {
			// Find the index of the selected item in the flat list
			let selectedIndex = -1

			if (!multiple && selectedItem) {
				// For single select, find the selected item
				selectedIndex = flatList.findIndex(
					(entry) => entry.type === 'option' && entry.item.value === selectedItem.value,
				)
			} else if (multiple && selectedItems.length > 0) {
				// For multi select, find the first selected item
				selectedIndex = flatList.findIndex(
					(entry) => entry.type === 'option' && selectedItems.some((selected) => selected.value === entry.item.value),
				)
			}

			if (selectedIndex >= 0) {
				// Calculate scroll position to center the selected item
				const targetScrollTop = Math.max(0, selectedIndex * itemHeight - containerHeight / 2 + itemHeight / 2)

				// Update both scroll state and actual scroll position
				// Set state first so virtual list calculates correctly
				scrollTop = targetScrollTop
				scrollContainer.scrollTop = targetScrollTop
			}
			// If no selected item, scrollTop stays at 0 (already set when dropdown was closed)
		}
	})

	const errorText = $derived.by(() => {
		if (error) return error
		if (!name) return undefined
		if (zodErrors) return zodErrors.find((e) => e.path.includes(name))?.message
		return undefined
	})
</script>

<!-- Data inputs for form submission -->
{#if multiple && Array.isArray(normalizedValue)}
	{#each normalizedValue as val, i (val + '-' + i)}
		<input type="hidden" {name} value={val} />
	{/each}
{:else if !multiple && normalizedValue !== undefined && normalizedValue !== null && normalizedValue !== ''}
	<input type="hidden" {name} value={normalizedValue} />
{/if}

<Label {label} {name} optional={!required} class={className} error={errorText}>
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
				handleDropdownClose()
			}}>
			<summary
				class="select h-max min-h-10 w-full min-w-12 cursor-pointer !bg-none pr-1"
				onclick={() => {
					searchEL?.focus()
					filter = ''
					filterMode = 'user'
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
							oninput={handleFilterInput}
							onclick={() => {
								detailsOpen = true
							}}
							placeholder="Search..."
							required={required && (!Array.isArray(normalizedValue) || normalizedValue.length === 0)} />
					</div>
				{:else}
					<!-- Single-select display -->
					<input
						type="text"
						class="h-full w-full outline-0 {detailsOpen ? 'cursor-text' : 'cursor-pointer'}"
						bind:this={searchEL}
						bind:value={filter}
						oninput={handleFilterInput}
						onclick={() => {
							detailsOpen = true
						}}
						placeholder={displayText}
						required={required && !normalizedValue} />
				{/if}

				{#if !required && ((multiple && Array.isArray(normalizedValue) && normalizedValue.length > 0) || (!multiple && normalizedValue))}
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
								if (onchange) onchange(value)
							}}>
							Select All
						</button>
						<button
							type="button"
							class="btn btn-sm hover:bg-base-content/10 grow"
							onclick={() => {
								value = []
								if (onchange) onchange(value)
							}}>
							Clear All
						</button>
					</div>
				{/if}
				{#if filteredItems.length === 0}
					<li class="m-2 text-center text-sm text-gray-500">No items found</li>
				{/if}

				{#if flatList.length > 0}
					<div class="relative max-h-80 overflow-y-auto pr-2" bind:this={scrollContainer} onscroll={handleScroll}>
						<!-- Virtual spacer for items before visible range -->
						{#if visibleItems.startIndex > 0}
							<div style="height: {visibleItems.startIndex * itemHeight}px;"></div>
						{/if}

						<!-- Render only visible items (headers and options) -->
						{#each visibleItems.items as entry, idx (entry.type === 'header' ? 'header-' + entry.group + '-' + idx : 'option-' + entry.item.value + '-' + idx)}
							{#if entry.type === 'header'}
								<li
									class="bg-base-200 top-0 z-10 flex items-center justify-center px-2 text-lg font-bold text-gray-700"
									style="height: {itemHeight}px;">
									{entry.group}
								</li>
							{:else}
								{@const item = entry.item}
								{@const isSelected = isItemSelected(item.value)}
								<li style="height: {itemHeight}px;">
									<button
										class="flex h-full w-full items-center gap-2 {isSelected
											? ' bg-primary text-primary-content hover:!bg-primary/70'
											: ''}"
										type="button"
										onclick={() => {
											toggleItemSelection(item.value)
											searchEL?.focus()
										}}>
										{#if multiple}
											<input
												type="checkbox"
												class="checkbox checkbox-sm !text-primary-content pointer-events-none"
												checked={isSelected}
												readonly />
										{/if}
										<span class="flex-1 text-left">{item.label}</span>
									</button>
								</li>
							{/if}
						{/each}

						<!-- Virtual spacer for items after visible range -->
						{#if visibleItems.endIndex < visibleItems.total}
							<div style="height: {(visibleItems.total - visibleItems.endIndex) * itemHeight}px;"></div>
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
