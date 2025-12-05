<script lang="ts">
	import { Input } from '$lib/index.js'
</script>

<div class="container mx-auto max-w-2xl space-y-8 px-4 py-8">
	<div class="space-y-2">
		<h1 class="text-4xl font-bold">Welcome to SimpleSvelte</h1>
		<p class="text-lg text-gray-600">
			Create your package using @sveltejs/package and preview/showcase your work with SvelteKit
		</p>
	</div>

	<!-- Input Component Tests -->
	<section class="space-y-4">
		<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
			<h2 class="text-xl font-semibold">Number Input</h2>
			<Input type="number" name="test-number-basic" label="Basic Number" />
			<Input type="number" name="test-number-required" label="Required Number" required />
			<Input type="number" name="test-number-minmax" label="Number (Min: 0, Max: 100)" min="0" max="100" />
			<Input type="number" name="test-number-step" label="Number with Step (0.5)" step="0.01" />
			<Input type="number" name="test-number-value" label="Number with Initial Value" value={42} />
			<Input type="number" name="test-number-disabled" label="Disabled Number" value={99} disabled />
		</div>

		<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
			<h2 class="text-xl font-semibold">Date Input</h2>
			<Input type="date" name="test" required label="Test required" />
		</div>

		<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
			<h2 class="text-xl font-semibold">DateTime Input</h2>
			<Input type="datetime-local" name="test" label="Test Option" />
		</div>

		<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
			<h2 class="text-xl font-semibold">Disabled Input</h2>
			<Input name="test-disabled" value="test" label="Test Input" disabled />
		</div>

		<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
			<h2 class="text-xl font-semibold">Checkbox</h2>
			<Input type="checkbox" name="test-checkbox" label="Test Checkbox" class="mb-4" />
			<Input type="checkbox" name="test-checkbox-required" label="Test Checkbox (Required)" required />
		</div>
	</section>

	<!-- Select Tests Link -->
	<section class="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-6">
		<h2 class="text-xl font-semibold">Select Component Tests</h2>
		<p class="text-sm text-gray-600">
			Check out the comprehensive test suite for Select component functionality with various configurations and edge
			cases.
		</p>
		<button
			onclick={() => (location.href = 'select-tests')}
			class="inline-block rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600">
			View Select Tests
		</button>
	</section>

	<!-- Modal Tests Link -->
	<section class="space-y-4 rounded-lg border border-purple-200 bg-purple-50 p-6">
		<h2 class="text-xl font-semibold">Modal Component Tests</h2>
		<p class="text-sm text-gray-600">
			Explore the modal component test suite with various scenarios including forms, confirmations, nested modals, and
			more.
		</p>
		<button
			onclick={() => (location.href = 'modal-tests')}
			class="inline-block rounded bg-purple-500 px-4 py-2 font-semibold text-white hover:bg-purple-600">
			View Modal Tests
		</button>
	</section>

	<!-- Documentation -->
	<section class="space-y-2 rounded-lg border border-gray-200 bg-white p-6">
		<h2 class="text-xl font-semibold">Documentation</h2>
		<p class="text-sm text-gray-600">
			Visit <a href="https://svelte.dev/docs/kit" class="font-semibold text-blue-500 hover:underline"
				>svelte.dev/docs/kit</a>
			to read the documentation
		</p>
	</section>
</div>
