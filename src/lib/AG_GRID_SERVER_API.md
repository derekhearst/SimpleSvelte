# AG Grid Server-Side Row Model (SSRM) - Server API

Clean, database-agnostic API for implementing AG Grid's Server-Side Row Model on the backend.

## Overview

This library provides a simple, strongly-typed interface for handling AG Grid SSRM requests on the server side. It works with any backend data source: Prisma, raw SQL, MongoDB, REST APIs, etc.

## Key Features

- ✅ **Database Agnostic** - Works with any data source
- ✅ **Type Safe** - Full TypeScript support with generics
- ✅ **Simple API** - Just implement `fetch` and `count`
- ✅ **Computed Fields** - Easy handling of virtual/calculated fields
- ✅ **Grouping Support** - Built-in row grouping support
- ✅ **Filter Transforms** - Automatic filter/sort transformation
- ✅ **Zero Boilerplate** - Clean, declarative configuration

## Quick Start

### 1. Basic Implementation (Prisma)

```typescript
import { createAGGridQuery } from '$lib/ag-grid'
import { query } from '$app/server'
import { DB } from '$lib/prisma.server'

export const getUsersPaginated = query(agGridRequestSchema, async (request) => {
	return await createAGGridQuery({
		async fetch(params) {
			return await DB.user.findMany({
				where: params.where,
				orderBy: params.orderBy,
				skip: params.skip,
				take: params.take,
			})
		},
		async count(params) {
			return await DB.user.count({ where: params.where })
		},
		defaultSort: { createdAt: 'desc' },
	})(request)
})
```

### 2. With Nested Relations (Auto-Handled!)

```typescript
export const getInterventionsPaginated = query(agGridRequestSchema, async (request) => {
	return await createAGGridQuery({
		async fetch(params) {
			return await DB.intervention.findMany({
				where: params.where,
				orderBy: params.orderBy,
				skip: params.skip,
				take: params.take,
				include: { location: true }, // Include the relation
			})
		},
		async count(params) {
			return await DB.intervention.count({ where: params.where })
		},
		// No computedFields needed! Just use field: 'location.name' in column definitions
		// The system automatically:
		// - Handles text filters: where.location.name contains 'X'
		// - Handles set filters: where.location.name in [...]
		// - Handles sorting: orderBy: { location: { name: 'asc' } }
		// - Handles grouping: where.location.name = 'groupKey'
		// - AG Grid displays nested values natively with dot notation
	})(request)
})
```

**Column Definition:**

```typescript
const columnDefs = [
	{ field: 'id' },
	{
		field: 'location.name', // ✨ Use dot notation directly!
		headerName: 'Location',
		filter: 'agTextColumnFilter',
	},
	{ field: 'dateOfEngagement', filter: 'agDateColumnFilter' },
]
```

### 3. With Complex Computed Fields

For truly computed/calculated values, provide custom handlers:

```typescript
computedFields: [
	{
		columnId: 'weekEnding',
		valueGetter: (record) => {
			// Calculate week ending date from dateOfEngagement
			const date = new Date(record.dateOfEngagement)
			const day = date.getDay()
			date.setDate(date.getDate() + (7 - day))
			return date.toISOString().split('T')[0]
		},
		filterHandler: (filterValue, where) => {
			// Custom filter logic for week ending
			const filter = filterValue as { dateFrom?: string }
			if (filter.dateFrom) {
				const targetDate = new Date(filter.dateFrom)
				const weekStart = new Date(targetDate)
				weekStart.setDate(targetDate.getDate() - 6)
				where.dateOfEngagement = { gte: weekStart, lte: targetDate }
			}
		},
	},
]
```

**Column Definition:**

```typescript
const columnDefs = [
	{
		field: 'weekEnding', // Custom computed field
		headerName: 'Week Ending',
		filter: 'agDateColumnFilter',
	},
]
```

### 4. Client-Side Usage

```svelte
<script lang="ts">
	import { getUsersPaginated } from './user.remote'
	import { createAGGridDatasource, createRemoteFetcher } from '$lib/ag-grid'
	import { AgGridSvelte } from 'ag-grid-svelte'

	let gridApi: GridApi

	const columnDefs = [
		{ field: 'id' },
		{ field: 'name', filter: 'agTextColumnFilter' },
		{ field: 'email', filter: 'agTextColumnFilter' },
		// For nested relations, use dot notation directly:
		{ field: 'profile.avatar', headerName: 'Avatar' },
		{ field: 'department.name', headerName: 'Department', filter: 'agTextColumnFilter' },
	]

	function onGridReady(params: any) {
		gridApi = params.api

		const datasource = createAGGridDatasource(createRemoteFetcher(getUsersPaginated))

		gridApi.setGridOption('serverSideDatasource', datasource)
	}
</script>

<div class="ag-theme-alpine" style="height: 600px;">
	<AgGridSvelte {columnDefs} rowModelType="serverSide" pagination={true} paginationPageSize={100} {onGridReady} />
</div>
```

## API Reference

### `createAGGridQuery(config)`

Main function to create a server-side query handler.

**Parameters:**

- `config: AGGridQueryConfig<TRecord, TWhereInput>`
  - `fetch: (params) => Promise<TRecord[]>` - Function to fetch data rows
  - `count: (params) => Promise<number>` - Function to count total rows
  - `computedFields?: ComputedField[]` - Optional computed field configurations
  - `defaultSort?: Record<string, 'asc' | 'desc'>` - Optional default sort
  - `transformWhere?: (where, request) => TWhereInput` - Optional WHERE clause transformer

**Returns:** `(request: AGGridRequest) => Promise<AGGridResponse<TRecord>>`

### `AGGridQueryParams`

The params object passed to `fetch` and `count` functions:

```typescript
interface AGGridQueryParams {
	where: TWhereInput // WHERE clause for filtering
	orderBy: Record<string, unknown>[] // ORDER BY for sorting
	skip: number // Pagination offset
	take: number // Pagination limit
	groupLevel: number // Current group level (for grouping)
	groupKeys: string[] // Group drill-down keys
	groupColumn?: AGGridColumn // Column being grouped
	isGroupRequest: boolean // Whether this is a group or leaf request
}
```

### `ComputedField`

Configuration for computed/virtual fields:

```typescript
interface ComputedField {
	columnId: string // Column ID in AG Grid
	dbField?: string // DB field path (e.g., 'location.name')
	// 👇 Optional - only needed for complex computed logic
	valueGetter?: (record) => unknown // Compute display value
	filterHandler?: (filterValue, where) => void // Handle filtering
	groupHandler?: (groupKey, where) => void // Handle grouping
}
```

**✨ Auto-Magic for Nested Fields:**

- If `dbField` contains a `.` (e.g., `'location.name'`), the system automatically:
  - Extracts nested values for display
  - Handles text and set filters
  - Handles sorting and grouping
- You only need `valueGetter`, `filterHandler`, and `groupHandler` for **complex computed logic**

## Common Patterns

### Pattern 1: Simple Nested Relations (Use Dot Notation!)

**Recommended:** Use dot notation directly in column definitions - no `computedFields` needed!

```typescript
// Server-side - just include the relation
return await createAGGridQuery({
	async fetch(params) {
		return await DB.model.findMany({
			where: params.where,
			orderBy: params.orderBy,
			skip: params.skip,
			take: params.take,
			include: { location: true, category: true, user: true },
		})
	},
	async count(params) {
		return await DB.model.count({ where: params.where })
	},
})(request)

// Client-side - use dot notation in field
const columnDefs = [
	{ field: 'location.name', headerName: 'Location', filter: 'agTextColumnFilter' },
	{ field: 'category.name', headerName: 'Category', filter: 'agTextColumnFilter' },
	{ field: 'user.email', headerName: 'User', filter: 'agTextColumnFilter' },
]
```

The system automatically handles:

- **Display**: AG Grid extracts `record.location.name` natively
- **Text Filter**: `where.location.name = { contains: 'X', mode: 'insensitive' }`
- **Set Filter**: `where.location.name = { in: ['A', 'B'] }`
- **Sorting**: `orderBy: { location: { name: 'asc' } }`
- **Grouping**: `where.location.name = 'groupKey'`

### Pattern 2: Complex Calculated Fields (Custom Handlers Required)

```typescript
computedFields: [
	{
		columnId: 'weekEnding',
		valueGetter: (record) => {
			const date = new Date(record.date)
			const day = date.getDay()
			date.setDate(date.getDate() + (7 - day))
			return date.toISOString().split('T')[0]
		},
		filterHandler: (filterValue, where) => {
			// Custom filter logic based on calculated value
			const targetDate = new Date(filterValue.dateFrom)
			const weekStart = new Date(targetDate)
			weekStart.setDate(targetDate.getDate() - 6)
			where.date = { gte: weekStart, lte: targetDate }
		},
	},
]
```

### Pattern 3: Custom WHERE Transform

```typescript
transformWhere: (where, request) => {
	// Add tenant filtering
	where.tenantId = getCurrentTenantId()

	// Add soft delete filter
	where.deletedAt = null

	return where
}
```

## Database Examples

### Prisma

```typescript
{
  async fetch(params) {
    return await DB.model.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    })
  },
  async count(params) {
    return await DB.model.count({ where: params.where })
  }
}
```

## Advanced Features

### Row Grouping

The API automatically handles row grouping. When `isGroupRequest` is `true`, it returns group rows with counts. When `false`, it returns leaf data.

```typescript
if (params.isGroupRequest) {
	// Return groups at current level
} else {
	// Return actual data rows
}
```

### Type Safety

Use TypeScript generics for full type safety:

```typescript
type UserWhereInput = {
  id?: number
  name?: { contains: string; mode: 'insensitive' }
  email?: { contains: string; mode: 'insensitive' }
}

createAGGridQuery<User, UserWhereInput>({
  // params.where is now typed as UserWhereInput
  async fetch(params) { ... },
  async count(params) { ... }
})
```

## Nested Field Magic Explained

When you use dot notation in field names (e.g., `'location.name'`), the system automatically handles everything:

```typescript
// Column definition
{ field: 'location.name', headerName: 'Location', filter: 'agTextColumnFilter' }

// Server-side - just include the relation
include: { location: true }
```

**What happens automatically:**

1. **Display**: AG Grid extracts `record.location.name` natively
2. **Text Filtering**: `where.location = { name: { contains: 'Office', mode: 'insensitive' } }`
3. **Set Filtering**: `where.location = { name: { in: ['Office A', 'Office B'] } }`
4. **Sorting**: `orderBy: [{ location: { name: 'asc' } }]`
5. **Grouping**: `where.location = { name: 'Office A' }`

**You write:** Column definition with dot notation

**You get:** All filtering, sorting, grouping, and display automatically! ✨

## See Also

- [AG Grid SSRM Documentation](https://www.ag-grid.com/javascript-data-grid/server-side-model/)
