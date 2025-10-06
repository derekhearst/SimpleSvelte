<script lang="ts">
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

	$effect(() => {
		ModuleRegistry.registerModules([AllEnterpriseModule, ClientSideRowModelModule])
		if (env.PUBLIC_AGGRID_KEY) {
			LicenseManager.setLicenseKey(env.PUBLIC_AGGRID_KEY)
		}
	})

	$effect(() => {
		if (!gridEl) return

		// Only create grid if it doesn't exist yet
		if (!gridApi) {
			gridApi = createGrid(gridEl, {
				...gridOptions,
				theme: themeQuartz,
				rowData: gridData,
			})
		} else {
			// Update existing grid
			gridApi.updateGridOptions({
				...gridOptions,
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
</script>

<div bind:this={gridEl} class={gridClass}></div>
