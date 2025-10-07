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
		gridApi?: GridApi
		gridData?: any[] // Replace with your actual data type
		gridOptions: GridOptions
		class?: string
	}
	let {
		gridEl = $bindable(),
		gridApi = $bindable(),
		gridData,
		gridOptions,
		class: gridClass = 'grow',
	}: Props = $props()

	// Register modules once

	onMount(() => {
		if (gridEl) {
			ModuleRegistry.registerModules([AllEnterpriseModule, ClientSideRowModelModule])
			if (env.PUBLIC_AGGRID_KEY) {
				LicenseManager.setLicenseKey(env.PUBLIC_AGGRID_KEY)
			}
			gridApi = createGrid(gridEl, {
				...gridOptions,
				theme: themeQuartz,
				rowData: gridData,
			})
		}

		// Cleanup function to destroy grid when component unmounts
		return () => {
			if (gridApi) {
				gridApi.destroy()
				gridApi = undefined
			}
		}
	})

	// Update grid when options or data change
	$effect(() => {
		if (gridApi) {
			gridApi.updateGridOptions({
				...gridOptions,
				rowData: gridData,
			})
			gridApi.refreshCells()
		}
	})
</script>

<div bind:this={gridEl} class={gridClass}></div>
