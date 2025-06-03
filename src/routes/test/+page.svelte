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

	<!-- Disabled Examples -->
	<div class="bg-base-100 mt-8 grid grid-cols-1 gap-8 p-2 lg:grid-cols-2">
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Disabled Single Select</h2>
			<Select value={2} {options} label="Disabled single select" name="disabled-single" disabled />
		</div>

		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Disabled Multi Select</h2>
			<Select value={[1, 3, 5]} {options} label="Disabled multi select" name="disabled-multi" multiple disabled />
		</div>
	</div>

	<!-- Form Example -->
	<div class="mt-8">
		<h2 class="mb-4 text-xl font-semibold">Form Example</h2>
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
		<h2 class="mb-4 text-xl font-semibold">REquired Form Example</h2>
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
