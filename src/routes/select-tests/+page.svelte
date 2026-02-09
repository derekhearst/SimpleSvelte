<script lang="ts">
	import Select from '$lib/Select.svelte'

	const options = [
		{ value: 'svelte', label: 'Svelte' },
		{ value: 'react', label: 'React' },
		{ value: 'vue', label: 'Vue' },
		{ value: 'angular', label: 'Angular' },
		{ value: 'solid', label: 'SolidJS' },
	]

	// Small list with 7 items
	let smallValue: number | undefined = $state()
	const smallOptions = [
		{ value: 1, label: 'Option 1' },
		{ value: 2, label: 'Option 2' },
		{ value: 3, label: 'Option 3' },
		{ value: 4, label: 'Option 4' },
		{ value: 5, label: 'Option 5' },
		{ value: 6, label: 'Option 6' },
		{ value: 7, label: 'Option 7' },
	]

	// Grouped test data
	let groupValueSmall = $state([])
	let groupValueLarge = $state([])
	const groupedOptionsSmall = [
		{ value: 'a', label: 'Apple', group: 'Fruit' },
		{ value: 'b', label: 'Banana', group: 'Fruit' },
		{ value: 'c', label: 'Carrot', group: 'Vegetable' },
		{ value: 'b1', label: 'Broccoli', group: 'Vegetable' },
		{ value: 'w', label: 'Water', group: 'Drink' },
		{ value: 'c2', label: 'Cola', group: 'Drink' },
		{ value: 'x', label: 'Other (ungrouped)' },
	]

	// Large grouped list (100+ items, 5 groups)
	const groupedOptionsLarge = Array.from({ length: 120 }, (_, i) => {
		const groupNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']
		const group = groupNames[i % groupNames.length]
		return {
			value: `item${i + 1}`,
			label: `Item ${i + 1}`,
			group: group,
		}
	})

	// Auto-scroll test data
	let autoScrollSingleValue = $state('item75')
	let autoScrollMultiValue = $state(['item25', 'item85', 'item105'])

	// Default value test
	let defaultValue = $state('react')
	let multiValue = $state([])
	let requiredValue: string | undefined = $state()
	let optionalValue = $state([])

	// Tab navigation test
	let tabTestSingle = $state('svelte')
	let tabTestMulti = $state(['react', 'vue'])

	// Dropdown position test
	let positionTestValue: string | undefined = $state()

	// Keyboard navigation test
	let keyboardSingleValue: string | undefined = $state()
	let keyboardMultiValue = $state([])
</script>

<div class="container mx-auto max-w-4xl space-y-8 px-4 py-8">
	<div class="space-y-2">
		<h1 class="text-4xl font-bold">Select Component Tests</h1>
		<p class="text-lg text-gray-600">Comprehensive test suite for Select component functionality</p>
	</div>

	<!-- Small Select Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Small Select (7 Items)</h2>
			<p class="text-sm text-gray-500">Basic select with limited options</p>
		</div>
		<Select bind:value={smallValue} options={smallOptions} label="Choose an option" name="small-select" />
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Selected:</strong>
			<span class="ml-2 text-gray-700">{smallValue || 'None selected'}</span>
		</div>
	</section>

	<!-- Default Value Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Select with Default Value</h2>
			<p class="text-sm text-gray-500">
				This select has "React" pre-selected by default. Opening the dropdown should scroll the parent container if
				needed to keep it in view.
			</p>
		</div>
		<Select bind:value={defaultValue} {options} label="Framework (with default)" name="default-select" />
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Selected:</strong>
			<span class="ml-2 text-gray-700">{defaultValue || 'None selected'}</span>
		</div>
	</section>

	<!-- Multi-Select Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Multi-Select Component Demo</h2>
			<p class="text-sm text-gray-500">Select multiple frameworks</p>
		</div>
		<Select
			bind:value={multiValue}
			{options}
			label="Choose your favorite frameworks"
			name="frameworks"
			multiple
			onchange={() => console.log('test')} />
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Selected:</strong>
			<span class="ml-2 text-gray-700">
				{#if Array.isArray(multiValue) && multiValue.length > 0}
					{multiValue.join(', ')}
				{:else}
					None selected
				{/if}
			</span>
		</div>
	</section>

	<!-- Grouped Small List Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Grouped Select (Small List)</h2>
			<p class="text-sm text-gray-500">Multi-select with grouped options</p>
		</div>
		<Select
			bind:value={groupValueSmall}
			options={groupedOptionsSmall}
			label="Grouped Small List"
			name="grouped-small"
			multiple />
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Selected:</strong>
			<span class="ml-2 text-gray-700">
				{#if Array.isArray(groupValueSmall) && groupValueSmall.length > 0}
					{groupValueSmall.join(', ')}
				{:else}
					None selected
				{/if}
			</span>
		</div>
	</section>

	<!-- Grouped Large List Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Grouped Select (Large List)</h2>
			<p class="text-sm text-gray-500">Multi-select with 120 grouped items across 5 groups</p>
		</div>
		<Select
			bind:value={groupValueLarge}
			options={groupedOptionsLarge}
			label="Grouped Large List"
			name="grouped-large"
			multiple />
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Selected:</strong>
			<span class="ml-2 text-gray-700">
				{#if Array.isArray(groupValueLarge) && groupValueLarge.length > 0}
					{groupValueLarge.join(', ')}
				{:else}
					None selected
				{/if}
			</span>
		</div>
	</section>

	<!-- Auto-scroll Single Select Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Auto-scroll to Selected Item (Single Select)</h2>
			<p class="text-sm text-gray-500">
				This select has "Item 75" pre-selected. When you open the dropdown, it should automatically scroll to center the
				selected item.
			</p>
		</div>
		<Select
			bind:value={autoScrollSingleValue}
			options={groupedOptionsLarge}
			label="Auto-scroll Single Select"
			name="auto-scroll-single" />
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Selected:</strong>
			<span class="ml-2 text-gray-700">{autoScrollSingleValue || 'None selected'}</span>
		</div>
	</section>

	<!-- Auto-scroll Multi Select Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Auto-scroll to Selected Items (Multi Select)</h2>
			<p class="text-sm text-gray-500">
				This select has multiple items pre-selected (Item 25, 85, 105). When you open the dropdown, it should scroll to
				the first selected item.
			</p>
		</div>
		<Select
			bind:value={autoScrollMultiValue}
			options={groupedOptionsLarge}
			label="Auto-scroll Multi Select"
			name="auto-scroll-multi"
			multiple />
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Selected:</strong>
			<span class="ml-2 text-gray-700">
				{#if Array.isArray(autoScrollMultiValue) && autoScrollMultiValue.length > 0}
					{autoScrollMultiValue.join(', ')}
				{:else}
					None selected
				{/if}
			</span>
		</div>
	</section>

	<!-- Required Select Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Required Select</h2>
			<p class="text-sm text-gray-500">Select field with required validation</p>
		</div>
		<Select {options} bind:value={requiredValue} required label="Required Frameworks" name="required-frameworks" />
	</section>

	<!-- Optional Multi Select Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Optional Multi-Select</h2>
			<p class="text-sm text-gray-500">Multi-select field (optional)</p>
		</div>
		<Select {options} bind:value={optionalValue} label="Optional Frameworks" name="optional-frameworks" multiple />
	</section>

	<!-- Tab Navigation Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Tab Navigation Test</h2>
			<p class="text-sm text-gray-500">
				Tab through this form - focus should move smoothly between inputs without getting stuck on clear buttons.
			</p>
		</div>
		<form class="flex flex-col gap-4">
			<input type="text" class="input input-bordered" placeholder="First input - start here and press Tab" />
			<Select
				bind:value={tabTestSingle}
				{options}
				label="Single Select (tab should pass through)"
				name="tab-test-single" />
			<Select
				bind:value={tabTestMulti}
				{options}
				label="Multi Select (tab should pass through)"
				name="tab-test-multi"
				multiple />
			<input type="text" class="input input-bordered" placeholder="Last input - Tab should reach here" />
		</form>
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Test:</strong>
			<span class="ml-2 text-gray-700">
				Click the first input, then press Tab repeatedly. Focus should move: First Input → Single Select → Multi Select
				→ Last Input without stopping on ✕ buttons.
			</span>
		</div>
	</section>

	<!-- Dropdown Position Test (Near Bottom) -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Dropdown Position Test</h2>
			<p class="text-sm text-gray-500">
				The dropdown should flip above the input when there's not enough space below. Scroll down so this select is near
				the bottom of your screen, then open it.
			</p>
		</div>
		<Select
			bind:value={positionTestValue}
			options={groupedOptionsLarge}
			label="Open near bottom of viewport"
			name="position-test" />
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Expected:</strong>
			<span class="ml-2 text-gray-700">
				When this select is near the bottom of the viewport, the dropdown should appear above the input instead of
				covering it.
			</span>
		</div>
	</section>

	<!-- Keyboard Navigation Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Keyboard Navigation Test</h2>
			<p class="text-sm text-gray-500">
				Focus the select, then use Arrow Down/Up to highlight items and Enter to select.
			</p>
		</div>
		<Select
			bind:value={keyboardSingleValue}
			{options}
			label="Single Select - use arrow keys"
			name="keyboard-single" />
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Selected:</strong>
			<span class="ml-2 text-gray-700">{keyboardSingleValue || 'None selected'}</span>
		</div>
		<Select
			bind:value={keyboardMultiValue}
			options={groupedOptionsSmall}
			label="Multi Select - use arrow keys + Enter to toggle"
			name="keyboard-multi"
			multiple />
		<div class="rounded bg-gray-50 p-3 text-sm">
			<strong>Selected:</strong>
			<span class="ml-2 text-gray-700">
				{#if Array.isArray(keyboardMultiValue) && keyboardMultiValue.length > 0}
					{keyboardMultiValue.join(', ')}
				{:else}
					None selected
				{/if}
			</span>
		</div>
		<div class="rounded bg-blue-50 p-3 text-sm">
			<strong>Instructions:</strong>
			<ul class="ml-4 mt-1 list-disc text-gray-700">
				<li>Tab into the select input</li>
				<li>Press Arrow Down/Up to open dropdown and navigate</li>
				<li>Press Enter to select/toggle the highlighted item</li>
				<li>Press Escape to close</li>
				<li>Highlighted item should have a subtle background</li>
			</ul>
		</div>
	</section>

	<!-- Spacer for testing near-bottom positioning -->
	<div class="h-96 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
		<p class="text-gray-500">Scroll spacer - position the select above near viewport bottom to test flip behavior</p>
	</div>
</div>
