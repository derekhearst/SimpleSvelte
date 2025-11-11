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
</div>
