<!-- Test page for multi-select functionality -->
<script lang="ts">
	import Select from '$lib/Select.svelte'

	let singleValue = $state(undefined)
	let multiValue = $state<number[]>([])
	const options = [
		{ value: 1, label: 'Option 1' },
		{ value: 2, label: 'Option 2' },
		{ value: 3, label: 'Option 3' },
		{ value: 4, label: 'Option 4' },
		{ value: 5, label: 'A Very Long Option Name to Test Layout' },
		{ value: 6, label: 'Option 6' },
		{ value: 7, label: 'Option 7' },
		{ value: 8, label: 'Option 8' },
		{ value: 9, label: 'Option 9' },
		{ value: 10, label: 'Option 10' },
	]

	// Generate large dataset with over 100 options
	const largeOptions = Array.from({ length: 150 }, (_, i) => ({
		value: i + 1,
		label: `${getRandomCategory()} ${i + 1}: ${getRandomName()}`,
	}))

	function getRandomCategory() {
		const categories = [
			'Product',
			'Service',
			'Location',
			'Category',
			'Item',
			'Element',
			'Component',
			'Feature',
			'Module',
			'Section',
			'Department',
			'Division',
			'Branch',
			'Unit',
			'Group',
			'Team',
			'Project',
			'Task',
			'Activity',
			'Process',
		]
		return categories[Math.floor(Math.random() * categories.length)]
	}

	function getRandomName() {
		const names = [
			'Alpha Systems',
			'Beta Solutions',
			'Gamma Technologies',
			'Delta Innovations',
			'Epsilon Networks',
			'Zeta Dynamics',
			'Eta Ventures',
			'Theta Analytics',
			'Iota Platforms',
			'Kappa Enterprises',
			'Lambda Services',
			'Mu Corporation',
			'Nu Industries',
			'Xi Solutions',
			'Omicron Systems',
			'Pi Technologies',
			'Rho Innovations',
			'Sigma Networks',
			'Tau Dynamics',
			'Upsilon Ventures',
			'Phi Analytics',
			'Chi Platforms',
			'Psi Enterprises',
			'Omega Services',
			'Advanced Framework',
			'Professional Suite',
			'Enterprise Edition',
			'Premium Package',
			'Standard Version',
			'Lite Edition',
			'Pro Series',
			'Ultimate Collection',
			'Master Class',
			'Expert Level',
			'Beginner Friendly',
			'Intermediate Grade',
			'Superior Quality',
			'Enhanced Performance',
			'Optimized Speed',
			'Improved Efficiency',
		]
		return names[Math.floor(Math.random() * names.length)]
	}

	let largeSingleValue = $state(undefined)
	let largeMultiValue = $state<number[]>([])
</script>

<div class="container mx-auto max-w-4xl p-8">
	<h1 class="mb-8 text-3xl font-bold">Select Component Test</h1>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<!-- Single Select -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Single Select</h2>

			<Select bind:value={singleValue} {options} label="Choose one option" name="single-select" required />
			<div class="bg-base-200 rounded-box p-4">
				<strong>Selected Value:</strong>
				{singleValue ?? 'None'}
			</div>
		</div>

		<!-- Multi Select -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Multi Select</h2>

			<Select bind:value={multiValue} {options} label="Choose multiple options" name="multi-select" multiple />
			<div class="bg-base-200 rounded-box p-4">
				<strong>Selected Values:</strong>
				{#if Array.isArray(multiValue) && multiValue.length > 0}
					{multiValue.join(', ')}
				{:else}
					None
				{/if}
			</div>
		</div>
	</div>

	<!-- Large Dataset Test (Over 100 Options) -->
	<div class="mt-8">
		<h2 class="text-primary mb-4 text-xl font-semibold">Large Dataset Test (150 Options)</h2>
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
			<!-- Large Single Select -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium">Single Select - Large Dataset</h3>
				<Select
					bind:value={largeSingleValue}
					options={largeOptions}
					label="Choose one from 150 options"
					name="large-single-select" />
				<div class="bg-base-200 rounded-box p-4">
					<strong>Selected Value:</strong>
					{largeSingleValue ?? 'None'}
					{#if largeSingleValue}
						<br /><strong>Selected Label:</strong>
						{largeOptions.find((opt) => opt.value === largeSingleValue)?.label ?? 'Unknown'}
					{/if}
				</div>
			</div>

			<!-- Large Multi Select -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium">Multi Select - Large Dataset</h3>
				<Select
					bind:value={largeMultiValue}
					options={largeOptions}
					label="Choose multiple from 150 options"
					name="large-multi-select"
					multiple />
				<div class="bg-base-200 rounded-box p-4">
					<strong>Selected Values:</strong>
					{#if Array.isArray(largeMultiValue) && largeMultiValue.length > 0}
						<div class="mt-2 max-h-32 overflow-y-auto">
							{#each largeMultiValue as value}
								<div class="badge badge-primary badge-sm mr-1 mb-1">
									{largeOptions.find((opt) => opt.value === value)?.label ?? `Value ${value}`}
								</div>
							{/each}
						</div>
						<div class="mt-2 text-sm opacity-70">
							Total selected: {largeMultiValue.length}
						</div>
					{:else}
						None
					{/if}
				</div>
			</div>
		</div>

		<!-- Performance Test Form -->
		<div class="mt-6">
			<h3 class="mb-4 text-lg font-medium">Performance Test Form</h3>
			<form
				class="bg-base-100 border-base-300 rounded-box space-y-4 border p-6 shadow-lg"
				onsubmit={(e) => {
					e.preventDefault()
					const formData = new FormData(e.target as HTMLFormElement)
					console.log('Large dataset form submitted:')
					for (const [key, value] of formData.entries()) {
						console.log(`${key}: ${value}`)
					}
				}}>
				<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Select
						bind:value={largeSingleValue}
						options={largeOptions}
						label="Single Selection (150 options)"
						name="perf-single"
						required />
					<Select
						bind:value={largeMultiValue}
						options={largeOptions}
						label="Multiple Selection (150 options)"
						name="perf-multi"
						multiple
						required />
				</div>
				<div class="flex gap-2">
					<button type="submit" class="btn btn-primary">Submit Performance Test</button>
					<button
						type="button"
						class="btn btn-secondary"
						onclick={() => {
							largeSingleValue = undefined
							largeMultiValue = []
						}}>
						Clear Selections
					</button>
				</div>
			</form>
		</div>
	</div>
	<!-- Original Small Dataset Tests -->
	<!-- Disabled Examples -->
	<div class="bg-base-100 mt-8 grid grid-cols-1 gap-8 p-2 lg:grid-cols-2">
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Disabled Single Select (Small Dataset)</h2>
			<Select value={2} {options} label="Disabled single select" name="disabled-single" disabled />
		</div>
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Disabled Multi Select (Small Dataset)</h2>
			<Select value={[1, 3, 5]} {options} label="Disabled multi select" name="disabled-multi" multiple disabled />
		</div>
	</div>
	<!-- Form Example -->
	<div class="mt-8">
		<h2 class="mb-4 text-xl font-semibold">Form Example (Small Dataset)</h2>
		<form
			class="bg-base-100 border-base-300 rounded-box space-y-4 border p-6 shadow-lg"
			onsubmit={(e) => {
				e.preventDefault()
				const formData = new FormData(e.target as HTMLFormElement)
				console.log('Form submitted:')
				for (const [key, value] of formData.entries()) {
					console.log(`${key}: ${value}`)
				}
			}}>
			<Select bind:value={singleValue} {options} label="Single Selection" name="form-single" />

			<Select bind:value={multiValue} {options} label="Multiple Selection" name="form-multi" multiple />

			<button type="submit" class="btn btn-primary"> Submit Form </button>
		</form>
	</div>
	<div class="mt-8">
		<h2 class="mb-4 text-xl font-semibold">Required Form Example (Small Dataset)</h2>
		<form
			class="bg-base-100 border-base-300 rounded-box space-y-4 border p-6 shadow-lg"
			onsubmit={(e) => {
				e.preventDefault()

				const formData = new FormData(e.target as HTMLFormElement)

				if (!(e.target as HTMLFormElement).checkValidity()) {
					console.log('Form is invalid')
					return
				}
				console.log('Form submitted:')
				for (const [key, value] of formData.entries()) {
					console.log(`${key}: ${value}`)
				}
			}}>
			<fieldset class="flex gap-2">
				<Select bind:value={singleValue} {options} label="Single Selection" name="form-single" required />

				<Select bind:value={multiValue} {options} label="Multiple Selection" name="form-multi" multiple required />
			</fieldset>
			<button type="submit" class="btn btn-primary"> Submit Form </button>
		</form>
	</div>
</div>
