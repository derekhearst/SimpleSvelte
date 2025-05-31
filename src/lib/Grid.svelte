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
	import { onMount } from 'svelte'

	type Props = {
		gridEl?: HTMLDivElement
		gridApi?: GridApi
		gridData: any[] // Replace with your actual data type
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

	onMount(() => {
		if (!gridEl || gridApi) return
		gridApi = createGrid(gridEl, {
			...gridOptions,
			theme: themeQuartz,
			rowData: gridData,
		})
	})
	// Keep it up to date if columns change
	$effect(() => {
		if (gridApi) gridApi.updateGridOptions(gridOptions)
	})

	$effect(() => {
		if (gridApi) gridApi.updateGridOptions({ rowData: gridData })
	})
</script>

<div bind:this={gridEl} class={gridClass}></div>
