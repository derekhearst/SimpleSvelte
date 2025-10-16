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

	onMount(() => {
		if (gridEl) {
			console.log('📊 Grid: Initializing AG Grid...')
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

			gridApi = createGrid(gridEl, gridConfig)

			if (gridData !== undefined) {
				const rowCount = gridData.length
				console.log(`✅ Grid: Initialized with ${rowCount} row(s) (client-side)`)
			} else {
				console.log('✅ Grid: Initialized with server-side data source')
			}
		}

		// Cleanup function to destroy grid when component unmounts
		return () => {
			if (gridApi) {
				console.log('🧹 Grid: Cleaning up and destroying grid instance')
				gridApi.destroy()
				gridApi = undefined
			}
		}
	})

	// Update grid when options or data change
	$effect(() => {
		if (gridApi && gridData !== undefined) {
			const rowCount = gridData.length
			console.log(`🔄 Grid: Updating grid with ${rowCount} row(s)`)
			gridApi.updateGridOptions({
				...gridOptions,
				rowData: gridData,
			})
			gridApi.refreshCells()
			console.log('✅ Grid: Data update complete')
		}
	})
</script>

<div bind:this={gridEl} class={gridClass}></div>
