<script lang="ts">
	import { clickOutside } from './utils.js'
	import Input from './Input.svelte'
	import Label from './Label.svelte'
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

	// Ensure value is properly typed for single/multiple mode
	// Normalize on access rather than maintaining separate state
	let normalizedValue = $derived.by(() => {
		if (multiple) {
			// For multiple mode, always work with arrays
			return Array.isArray(value) ? value : value ? [value] : []
		} else {
			// For single mode, extract first value if array
			return Array.isArray(value) ? (value.length > 0 ? value[0] : undefined) : value
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

	// Remove specific item from multi-select
	function toggleItemSelection(itemValue: any) {
		if (!multiple) {
			// Close dropdown and update filter immediately
			filterInput = items.find((item) => item.value === itemValue)?.label || ''
			detailsOpen = false
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
		filterInput = ''
		detailsOpen = false
		if (onchange) onchange(value)
	}

	// User's filter input - always editable
	let filterInput = $state('')

	// Display value in filter box for single-select when closed
	let filter = $derived.by(() => {
		// In single select mode when dropdown is closed, show selected item
		if (!multiple && !detailsOpen && selectedItem) {
			return selectedItem.label
		}
		// Otherwise use the user's filter input
		return filterInput
	})

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

		// In multiple mode, separate selected and unselected items
		if (multiple && Array.isArray(normalizedValue) && normalizedValue.length > 0) {
			const selectedUngrouped: Option[] = []
			const unselectedUngrouped: Option[] = []

			for (const item of ungrouped) {
				if (normalizedValue.includes(item.value)) {
					selectedUngrouped.push(item)
				} else {
					unselectedUngrouped.push(item)
				}
			}

			// Add selected ungrouped items first
			for (const item of selectedUngrouped) {
				result.push({ type: 'option', item })
			}
			// Then unselected ungrouped items
			for (const item of unselectedUngrouped) {
				result.push({ type: 'option', item })
			}

			// Add grouped items with headers, also with selected first within each group
			for (const groupName of Object.keys(groups)) {
				const groupItems = groups[groupName]
				const selectedGroupItems = groupItems.filter((item) => normalizedValue.includes(item.value))
				const unselectedGroupItems = groupItems.filter((item) => !normalizedValue.includes(item.value))

				result.push({ type: 'header', group: groupName })
				for (const item of selectedGroupItems) {
					result.push({ type: 'option', item })
				}
				for (const item of unselectedGroupItems) {
					result.push({ type: 'option', item })
				}
			}
		} else {
			// Normal ordering when not in multiple mode or no selections
			for (const item of ungrouped) {
				result.push({ type: 'option', item })
			}
			for (const groupName of Object.keys(groups)) {
				result.push({ type: 'header', group: groupName })
				for (const item of groups[groupName]) {
					result.push({ type: 'option', item })
				}
			}
		}

		return result
	})

	let searchEL: HTMLInputElement | undefined = $state(undefined)

	// Virtual list implementation
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
	function scrollToSelected(node: HTMLDivElement) {
		const unsubscribe = $effect.root(() => {
			$effect(() => {
				if (detailsOpen) {
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
							(entry) =>
								entry.type === 'option' && selectedItems.some((selected) => selected.value === entry.item.value),
						)
					}

					if (selectedIndex >= 0) {
						// Calculate scroll position to center the selected item
						const targetScrollTop = Math.max(0, selectedIndex * itemHeight - containerHeight / 2 + itemHeight / 2)
						// Set scroll position directly on the DOM node
						node.scrollTop = targetScrollTop
					}
				}
			})
		})

		return {
			destroy() {
				unsubscribe()
			},
		}
	}

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
				detailsOpen = false
			}}>
			<summary
				class="select h-max min-h-10 w-full min-w-12 cursor-pointer bg-none! pr-1"
				onclick={() => {
					searchEL?.focus()
					filterInput = ''
				}}>
				{#if multiple}
					<!-- Multi-select display with condensed chips -->
					<div class="flex min-h-8 flex-wrap gap-1 p-1">
						{#if selectedItems.length > 0}
							<!-- Show first selected item -->
							<div class="badge badge-neutral bg-base-200 text-base-content gap-1">
								<span class="max-w-[200px] truncate">{selectedItems[0].label}</span>
								<button
									type="button"
									class="btn btn-xs btn-circle btn-ghost hover:bg-base-300"
									onclick={(e) => {
										e.stopPropagation()
										removeSelectedItem(selectedItems[0].value)
									}}>
									✕
								</button>
							</div>

							{#if selectedItems.length > 1}
								<!-- Show count indicator for remaining items -->
								<div class="badge badge-ghost text-base-content/70">
									(+{selectedItems.length - 1} more)
								</div>
							{/if}
						{/if}
						<!-- Search input for filtering in multi-select -->
						<input
							type="text"
							class="h-full min-w-[120px] flex-1 outline-0 {detailsOpen ? 'cursor-text' : 'cursor-pointer'}"
							bind:this={searchEL}
							bind:value={filterInput}
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
						value={filter}
						oninput={(e) => (filterInput = e.currentTarget.value)}
						onclick={() => {
							detailsOpen = true
						}}
						{placeholder}
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
					<div class="relative max-h-80 overflow-y-auto pr-2" use:scrollToSelected onscroll={handleScroll}>
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
								{@const isSelected = multiple
									? Array.isArray(normalizedValue) && normalizedValue.includes(item.value)
									: item.value === normalizedValue}
								<li style="height: {itemHeight}px;">
									<button
										class="flex h-full w-full items-center gap-2 {isSelected
											? ' bg-primary text-primary-content hover:bg-primary/70!'
											: ''}"
										type="button"
										onclick={() => {
											toggleItemSelection(item.value)
											searchEL?.focus()
										}}>
										{#if multiple}
											<input
												type="checkbox"
												class="checkbox checkbox-sm text-primary-content! pointer-events-none"
												checked={isSelected}
												readonly />
										{/if}
										<span class="flex-1 overflow-hidden text-left text-nowrap text-ellipsis">{item.label}</span>
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
