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
		gridData?: any[] // Replace with your actual data type
		gridOptions: GridOptions
		class?: string
	}
	let { gridEl = $bindable(), gridData, gridOptions, class: gridClass = 'grow' }: Props = $props()

	// Register modules once

	let gridApi: GridApi | undefined
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

		const gridConfig = {
			...gridOptions,
			theme: themeQuartz,
			...(gridData !== undefined && { rowData: gridData }),
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
