<script lang="ts">
	import { Input } from '$lib/index.js'
	import Select from '$lib/Select.svelte'

	let value = $state([])
	const options = [
		{ value: 'svelte', label: 'Svelte' },
		{ value: 'react', label: 'React' },
		{ value: 'vue', label: 'Vue' },
		{ value: 'angular', label: 'Angular' },
		{ value: 'solid', label: 'SolidJS' },
	]

	// Small list with 7 items
	let smallValue = $state()
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
	let autoScrollSingleValue = $state('item75') // Pre-select item that's far down the list
	let autoScrollMultiValue = $state(['item25', 'item85', 'item105']) // Pre-select multiple items scattered throughout
</script>

<div class="container mx-auto max-w-2xl p-8">
	<h1 class="mb-4 text-4xl font-bold">Welcome to SimpleSvelte</h1>
	<p class="mb-8 text-lg">Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>

	<div class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Small Select (7 Items)</h2>
		<Select bind:value={smallValue} options={smallOptions} label="Choose an option" name="small-select" />
		<div class="bg-base-200 rounded-box mt-4 p-4">
			<strong>Selected:</strong>
			{smallValue || 'None selected'}
		</div>
	</div>

	<div class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Multi-Select Component Demo</h2>
		<Select
			bind:value
			{options}
			label="Choose your favorite frameworks"
			name="frameworks"
			onchange={() => console.log('test')} />

		<div class="bg-base-200 rounded-box mt-4 p-4">
			<strong>Selected:</strong>
			{#if Array.isArray(value) && value.length > 0}
				{value.join(', ')}
			{:else}
				None selected
			{/if}
		</div>
	</div>

	<!-- Grouping Test Section -->
	<div class="mb-8">
		<h2 class="mb-2 text-xl font-semibold">Test: Grouped Select (Small List)</h2>
		<Select
			bind:value={groupValueSmall}
			options={groupedOptionsSmall}
			label="Grouped Small List"
			name="grouped-small"
			multiple />
		<div class="bg-base-200 rounded-box mt-2 p-2">
			<strong>Selected:</strong>
			{#if Array.isArray(groupValueSmall) && groupValueSmall.length > 0}
				{groupValueSmall.join(', ')}
			{:else}
				None selected
			{/if}
		</div>
	</div>

	<div class="mb-8">
		<h2 class="mb-2 text-xl font-semibold">Test: Grouped Select (Large List)</h2>

		<Select
			bind:value={groupValueLarge}
			options={groupedOptionsLarge}
			label="Grouped Large List"
			name="grouped-large"
			multiple />
		<div class="bg-base-200 rounded-box mt-2 p-2">
			<strong>Selected:</strong>
			{#if Array.isArray(groupValueLarge) && groupValueLarge.length > 0}
				{groupValueLarge.join(', ')}
			{:else}
				None selected
			{/if}
		</div>
	</div>

	<!-- Auto-scroll Test Sections -->
	<div class="mb-8">
		<h2 class="mb-2 text-xl font-semibold">Test: Auto-scroll to Selected Item (Single Select)</h2>
		<p class="mb-4 text-sm text-gray-600">
			This select has "Item 75" pre-selected. When you open the dropdown, it should automatically scroll to center the
			selected item.
		</p>
		<Select
			bind:value={autoScrollSingleValue}
			options={groupedOptionsLarge}
			label="Auto-scroll Single Select"
			name="auto-scroll-single" />
		<div class="bg-base-200 rounded-box mt-2 p-2">
			<strong>Selected:</strong>
			{autoScrollSingleValue || 'None selected'}
		</div>
	</div>

	<div class="mb-8">
		<h2 class="mb-2 text-xl font-semibold">Test: Auto-scroll to Selected Items (Multi Select)</h2>
		<p class="mb-4 text-sm text-gray-600">
			This select has multiple items pre-selected (Item 25, 85, 105). When you open the dropdown, it should scroll to
			the first selected item.
		</p>
		<Select
			bind:value={autoScrollMultiValue}
			options={groupedOptionsLarge}
			label="Auto-scroll Multi Select"
			name="auto-scroll-multi"
			multiple />
		<div class="bg-base-200 rounded-box mt-2 p-2">
			<strong>Selected:</strong>
			{#if Array.isArray(autoScrollMultiValue) && autoScrollMultiValue.length > 0}
				{autoScrollMultiValue.join(', ')}
			{:else}
				None selected
			{/if}
		</div>
	</div>

	<Input type="date" name="test" required label="Test required" />

	<Input type="datetime-local" name="test" label="Test Option" />
	<div class="bg-base-100">
		<Input name="" value="test" label="Test Input" disabled class="mb-4" />
	</div>

	<Input type="checkbox" name="test-checkbox" label="Test Checkbox" class="mb-4" />
	<Input type="checkbox" name="test-checkbox" label="Test Checkbox" required class="mb-4" />

	<Select {options} required label="Required Frameworks" name="frameworks" />
	<Select {options} label="Optional Frameworks" name="frameworks" multiple />

	<p>
		Visit <a href="https://svelte.dev/docs/kit" class="link link-primary">svelte.dev/docs/kit</a> to read the documentation
	</p>
	<p><a href="/test" class="link link-primary">View comprehensive test page →</a></p>
</div>
