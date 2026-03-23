<script lang="ts">
	import { onMount } from 'svelte'
	import { env } from '$env/dynamic/public'
	import {
		AllEnterpriseModule,
		ClientSideRowModelModule,
		createGrid,
		LicenseManager,
		ModuleRegistry,
		themeQuartz,
		type GridApi,
		type GridOptions,
	} from 'ag-grid-enterprise'

	type Props = {
		gridEl?: HTMLDivElement
		/** Bindable reference to the AG Grid API. Use `bind:gridApi` on the parent. */
		gridApi?: GridApi
		gridData?: any[] // Replace with your actual data type
		gridOptions: GridOptions
		/**
		 * localStorage key for automatic grid state persistence (filters, sorts, column widths).
		 * When set, state is saved on every change and restored on mount.
		 */
		stateKey?: string
		class?: string
	}
	let {
		gridEl = $bindable(),
		gridApi = $bindable(),
		gridData,
		gridOptions,
		stateKey,
		class: gridClass = 'grow',
	}: Props = $props()
	let initCheckInterval: ReturnType<typeof setInterval> | undefined
	let attemptCount = 0

	function initializeGrid() {
		if (!gridEl) {
			console.log('⏳ Grid: Element not available yet')
			return
		}

		if (gridApi) {
			console.log('ℹ️ Grid: Already initialized, skipping')
			return
		}

		attemptCount++
		console.log(`📊 Grid: Initializing AG Grid (attempt ${attemptCount})...`)
		console.log('📋 Grid: Registering modules...')
		ModuleRegistry.registerModules([AllEnterpriseModule, ClientSideRowModelModule])

		if (env.PUBLIC_AGGRID_KEY) {
			LicenseManager.setLicenseKey(env.PUBLIC_AGGRID_KEY)
			console.log('✅ Grid: License key applied successfully')
		} else {
			console.warn('⚠️ Grid: No license key found. Running in trial mode.')
		}

		// Wrap onGridReady to expose the gridApi bindable and handle stateKey persistence,
		// while still calling the user's own onGridReady callback if provided.
		const userOnGridReady = gridOptions.onGridReady

		// Load saved state upfront — must be in gridConfig.initialState, not applied post-init.
		let savedState: object | undefined
		if (stateKey) {
			try {
				const raw = localStorage.getItem(stateKey)
				if (raw) savedState = JSON.parse(raw)
			} catch {
				/* ignore parse errors */
			}
		}

		const gridConfig = {
			...gridOptions,
			theme: themeQuartz,
			...(gridData !== undefined && { rowData: gridData }),
			...(savedState !== undefined && { initialState: savedState }),
			onGridReady: (params: Parameters<NonNullable<GridOptions['onGridReady']>>[0]) => {
				userOnGridReady?.(params)
				gridApi = params.api
				if (stateKey) {
					params.api.addEventListener('stateUpdated', (e: any) => {
						try {
							localStorage.setItem(stateKey, JSON.stringify(e.state))
						} catch {
							/* ignore storage errors */
						}
					})
				}
			},
		}

		console.log('🎨 Grid: Creating grid instance...')
		gridApi = createGrid(gridEl, gridConfig)

		if (gridData !== undefined) {
			const rowCount = gridData.length
			console.log(`✅ Grid: Initialized with ${rowCount} row(s) (client-side)`)
		} else {
			console.log('✅ Grid: Initialized with server-side data source')
		}

		// Clear the interval once grid is created
		if (initCheckInterval) {
			console.log('⏹️ Grid: Stopping initialization checks')
			clearInterval(initCheckInterval)
			initCheckInterval = undefined
		}
	}

	onMount(() => {
		console.log('🚀 Grid: Component mounted')

		// Try to initialize immediately
		initializeGrid()

		// If grid wasn't created, set up interval to keep checking
		if (!gridApi) {
			console.log('⏱️ Grid: Element not ready, checking every 100ms...')
			initCheckInterval = setInterval(() => {
				initializeGrid()
			}, 100)
		}

		// Cleanup function to destroy grid and clear interval when component unmounts
		return () => {
			console.log('💥 Grid: Component unmounting')
			if (initCheckInterval) {
				console.log('⏹️ Grid: Clearing initialization interval')
				clearInterval(initCheckInterval)
				initCheckInterval = undefined
			}
			if (gridApi) {
				console.log('🧹 Grid: Destroying grid instance')
				gridApi.destroy()
				gridApi = undefined
				console.log('✅ Grid: Cleanup complete')
			}
		}
	})

	// Update grid when options or data change
	$effect(() => {
		if (gridApi && gridData !== undefined) {
			const rowCount = gridData.length
			console.log(`🔄 Grid: Data changed, updating grid with ${rowCount} row(s)`)

			try {
				gridApi.updateGridOptions({
					...gridOptions,
					rowData: gridData,
				})
				gridApi.refreshCells()
				console.log('✅ Grid: Data update complete')
			} catch (error) {
				console.error('❌ Grid: Error updating data:', error)
			}
		} else if (!gridApi && gridData !== undefined) {
			console.log('⚠️ Grid: Data available but grid not initialized yet')
		}
	})
</script>

<div bind:this={gridEl} class={gridClass}></div>
