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
</script>

<div class="container mx-auto max-w-2xl p-8">
	<h1 class="mb-4 text-4xl font-bold">Welcome to SimpleSvelte</h1>
	<p class="mb-8 text-lg">Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>

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
