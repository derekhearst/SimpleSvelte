<script lang="ts">
	import Select from '$lib/Select.svelte'

	// Simulate a slow API call that depends on the selected value
	// This mirrors the SiteTools pattern: Select bound to a value that triggers a long async derived
	async function slowFetch(category: string): Promise<string[]> {
		await new Promise((resolve) => setTimeout(resolve, 3000))
		const data: Record<string, string[]> = {
			fruits: ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'],
			veggies: ['Artichoke', 'Broccoli', 'Carrot', 'Daikon', 'Eggplant'],
			grains: ['Barley', 'Corn', 'Oats', 'Quinoa', 'Rice'],
		}
		return data[category] ?? []
	}

	const categoryOptions = [
		{ value: 'fruits', label: 'Fruits (waits 3s)' },
		{ value: 'veggies', label: 'Vegetables (waits 3s)' },
		{ value: 'grains', label: 'Grains (waits 3s)' },
	]

	let selectedCategory = $state<string | undefined>(undefined)

	// Mock query-like resource to mirror remote() usage in consumers:
	// const result = $derived(remoteFn(params));
	// const data = $derived(await result.current);
	// pending={result.pending > 0}
	type QueryLike<T> = {
		current: T | undefined
		pending: number
	}

	class SlowItemsQuery implements QueryLike<string[]> {
		current = $state<string[] | undefined>(undefined)
		pending = $state(0)

		constructor(category: string) {
			this.pending = 1
			slowFetch(category)
				.then((result) => {
					this.current = result
				})
				.finally(() => {
					this.pending = 0
				})
		}
	}

	const emptyItemsQuery: QueryLike<string[]> = {
		current: [],
		pending: 0,
	}

	const itemsQuery = $derived<QueryLike<string[]>>(
		selectedCategory ? new SlowItemsQuery(selectedCategory) : emptyItemsQuery,
	)
	const items = $derived(itemsQuery.current ?? [])
</script>

<div class="mx-auto max-w-xl space-y-8 p-8">
	<div>
		<h1 class="mb-1 text-2xl font-bold">Async Select Test</h1>
		<p class="text-base-content/60 text-sm">
			Simulates a Select whose bound value drives a slow async derived (3s delay), like the
			"Approve time for" dropdown driving <code>getApprovalQueue</code> in SiteTools.
		</p>
		<ul class="text-base-content/70 mt-2 list-inside list-disc space-y-1 text-sm">
			<li>
				<strong>Expected:</strong> label updates <em>immediately</em> on selection, spinner appears on
				the right
			</li>
			<li><strong>Expected:</strong> results section below updates ~3s later</li>
			<li>
				<strong>Regression check:</strong> open dropdown rapidly — it should always be visible
			</li>
		</ul>
	</div>

	<!-- The Select itself — this is what we're testing -->
	<Select
		name="category"
		label="Select a category"
		options={categoryOptions}
		bind:value={selectedCategory}
		pending={itemsQuery.pending > 0}
		placeholder="Pick a category..." />

	<div class="text-sm">
		Bound value: <code class="bg-base-200 rounded px-1">{selectedCategory ?? 'undefined'}</code>
	</div>

	<!-- Results section depends on the slow async derived -->
	<div class="rounded-box bg-base-200 min-h-24 p-4">
		<h2 class="mb-3 font-semibold">Items (async, 3s delay)</h2>
		{#if items.length === 0}
			<p class="text-base-content/50 text-sm">
				{selectedCategory ? 'Loading...' : 'Select a category above'}
			</p>
		{:else}
			<ul class="space-y-1">
				{#each items as item}
					<li class="text-sm">• {item}</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Second Select to verify no synchronized-update coupling between independent selects -->
	<div class="border-base-300 border-t pt-6">
		<h2 class="mb-3 font-semibold text-sm">Independent static Select (should never be frozen)</h2>
		<Select
			name="independent"
			label="Static options — no async deps"
			options={[
				{ value: 'a', label: 'Alpha' },
				{ value: 'b', label: 'Beta' },
				{ value: 'c', label: 'Gamma' },
			]}
			placeholder="Pick one..." />
	</div>
</div>
