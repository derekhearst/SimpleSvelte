<script lang="ts">
	import Modal from '$lib/Modal.svelte'
	import { Input } from '$lib/index.js'

	let basicModalOpen = $state(false)
	let formModalOpen = $state(false)
	let confirmModalOpen = $state(false)
	let contentModalOpen = $state(false)
	let nestedModalOpen = $state(false)
	let nestedInnerModalOpen = $state(false)
	let multiModal1Open = $state(false)
	let multiModal2Open = $state(false)
	let multiModal3Open = $state(false)

	let formData = $state({
		name: '',
		email: '',
		message: '',
	})

	let confirmResult = $state<string>('')

	function handleFormSubmit() {
		console.log('Form submitted:', formData)
		formModalOpen = false
		formData = { name: '', email: '', message: '' }
	}

	function handleConfirm() {
		confirmResult = 'Confirmed!'
		confirmModalOpen = false
	}

	function handleCancel() {
		confirmResult = 'Cancelled!'
		confirmModalOpen = false
	}
</script>

<div class="container mx-auto max-w-4xl space-y-8 px-4 py-8">
	<div class="space-y-2">
		<h1 class="text-4xl font-bold">Modal Component Tests</h1>
		<p class="text-lg text-gray-600">Comprehensive test suite for Modal component functionality</p>
	</div>

	<!-- Basic Modal Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Basic Modal</h2>
			<p class="text-sm text-gray-500">Simple modal with title and basic content</p>
		</div>
		<button
			onclick={() => (basicModalOpen = true)}
			class="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600">
			Open Basic Modal
		</button>
		<Modal bind:open={basicModalOpen} title="Basic Modal">
			<div class="space-y-4">
				<p class="text-gray-700">
					This is a basic modal component. You can close it by clicking the X button or by clicking outside.
				</p>
				<button
					onclick={() => (basicModalOpen = false)}
					class="rounded bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400">
					Close Modal
				</button>
			</div>
		</Modal>
	</section>

	<!-- Form Modal Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Modal with Form</h2>
			<p class="text-sm text-gray-500">Modal containing form inputs and validation</p>
		</div>
		<button
			onclick={() => (formModalOpen = true)}
			class="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600">
			Open Form Modal
		</button>
		<Modal bind:open={formModalOpen} title="Contact Form">
			<form
				onsubmit={(e) => {
					e.preventDefault()
					handleFormSubmit()
				}}
				class="space-y-4">
				<Input name="name" label="Name" placeholder="Enter your name" bind:value={formData.name} required />
				<Input
					name="email"
					type="email"
					label="Email"
					placeholder="Enter your email"
					bind:value={formData.email}
					required />
				<Input name="message" label="Message" placeholder="Enter your message" bind:value={formData.message} />
				<div class="flex gap-2">
					<button
						type="submit"
						class="flex-1 rounded bg-green-500 px-4 py-2 font-semibold text-white hover:bg-green-600">
						Submit
					</button>
					<button
						type="button"
						onclick={() => (formModalOpen = false)}
						class="flex-1 rounded bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400">
						Cancel
					</button>
				</div>
			</form>
		</Modal>
	</section>

	<!-- Confirmation Modal Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Confirmation Modal</h2>
			<p class="text-sm text-gray-500">Modal for user confirmation with multiple action buttons</p>
		</div>
		<button
			onclick={() => (confirmModalOpen = true)}
			class="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600">
			Open Confirmation Modal
		</button>
		{#if confirmResult}
			<div class="rounded bg-gray-50 p-3 text-sm">
				<strong>Result:</strong>
				<span class="ml-2 text-gray-700">{confirmResult}</span>
			</div>
		{/if}
		<Modal bind:open={confirmModalOpen} title="Confirm Action">
			<div class="space-y-4">
				<p class="text-gray-700">Are you sure you want to proceed with this action?</p>
				<div class="flex gap-2">
					<button
						onclick={handleConfirm}
						class="flex-1 rounded bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600">
						Confirm
					</button>
					<button onclick={handleCancel} class="flex-1 rounded bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400">
						Cancel
					</button>
				</div>
			</div>
		</Modal>
	</section>

	<!-- Content Rich Modal Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Content Rich Modal</h2>
			<p class="text-sm text-gray-500">Modal with rich HTML content and styling</p>
		</div>
		<button
			onclick={() => (contentModalOpen = true)}
			class="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600">
			Open Content Modal
		</button>
		<Modal bind:open={contentModalOpen} title="Feature Details">
			<div class="space-y-4">
				<div class="rounded-lg bg-blue-50 p-4">
					<h3 class="font-semibold text-blue-900">Feature Highlights</h3>
					<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800">
						<li>Easy to use and integrate</li>
						<li>Fully customizable styling</li>
						<li>Responsive design</li>
						<li>Accessible components</li>
					</ul>
				</div>
				<div class="rounded-lg bg-green-50 p-4">
					<h3 class="font-semibold text-green-900">Benefits</h3>
					<p class="mt-2 text-sm text-green-800">
						This modal component provides a flexible way to display content and interact with users.
					</p>
				</div>
				<button
					onclick={() => (contentModalOpen = false)}
					class="w-full rounded bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400">
					Close
				</button>
			</div>
		</Modal>
	</section>

	<!-- Nested Modal Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Nested Modal</h2>
			<p class="text-sm text-gray-500">Modal containing another modal (nested modals)</p>
		</div>
		<button
			onclick={() => (nestedModalOpen = true)}
			class="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600">
			Open Outer Modal
		</button>
		<Modal bind:open={nestedModalOpen} title="Outer Modal">
			<div class="space-y-4">
				<p class="text-gray-700">This is the outer modal. You can open an inner modal from here.</p>
				<button
					onclick={() => (nestedInnerModalOpen = true)}
					class="rounded bg-purple-500 px-4 py-2 font-semibold text-white hover:bg-purple-600">
					Open Inner Modal
				</button>
				<button
					onclick={() => (nestedModalOpen = false)}
					class="w-full rounded bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400">
					Close Outer Modal
				</button>
			</div>
		</Modal>
		<Modal bind:open={nestedInnerModalOpen} title="Inner Modal">
			<div class="space-y-4">
				<p class="text-gray-700">This is a nested modal opened from within another modal.</p>
				<button
					onclick={() => (nestedInnerModalOpen = false)}
					class="w-full rounded bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400">
					Close Inner Modal
				</button>
			</div>
		</Modal>
	</section>

	<!-- Multiple Independent Modals Test -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<div>
			<h2 class="text-xl font-semibold">Multiple Independent Modals</h2>
			<p class="text-sm text-gray-500">Multiple modals that can be opened independently</p>
		</div>
		<div class="flex gap-2">
			<button
				onclick={() => (multiModal1Open = true)}
				class="rounded bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-600">
				Modal 1
			</button>
			<button
				onclick={() => (multiModal2Open = true)}
				class="rounded bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-600">
				Modal 2
			</button>
			<button
				onclick={() => (multiModal3Open = true)}
				class="rounded bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-600">
				Modal 3
			</button>
		</div>
		<Modal bind:open={multiModal1Open} title="Modal 1">
			<div class="space-y-4">
				<p class="text-gray-700">This is modal number 1. You can open other modals independently.</p>
				<button
					onclick={() => (multiModal1Open = false)}
					class="w-full rounded bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400">
					Close
				</button>
			</div>
		</Modal>
		<Modal bind:open={multiModal2Open} title="Modal 2">
			<div class="space-y-4">
				<p class="text-gray-700">This is modal number 2. You can open other modals independently.</p>
				<button
					onclick={() => (multiModal2Open = false)}
					class="w-full rounded bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400">
					Close
				</button>
			</div>
		</Modal>
		<Modal bind:open={multiModal3Open} title="Modal 3">
			<div class="space-y-4">
				<p class="text-gray-700">This is modal number 3. You can open other modals independently.</p>
				<button
					onclick={() => (multiModal3Open = false)}
					class="w-full rounded bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400">
					Close
				</button>
			</div>
		</Modal>
	</section>

	<!-- Link back to main page -->
	<section class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
		<button
			onclick={() => (location.href = '.')}
			class="rounded bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600">
			Back to Home
		</button>
	</section>
</div>
