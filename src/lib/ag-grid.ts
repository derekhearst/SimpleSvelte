/**
 * AG Grid Server-Side Row Model (SSRM) - Server-Side Implementation API
 *
 * This module provides a clean, strongly-typed interface for implementing
 * AG Grid's Server-Side Row Model on the backend with any data source.
 *
 * @example Server-Side Usage (SvelteKit Remote Function)
 * ```typescript
 * import { createAGGridQuery, agGridRequestSchema } from '$lib/ag-grid'
 * import { query } from '$app/server'
 *
 * export const getUsersPaginated = query(agGridRequestSchema, async (request) => {
 *   return await createAGGridQuery({
 *     async fetch(params) {
 *       // Your data fetching logic
 *       const users = await DB.user.findMany({
 *         where: params.where,
 *         orderBy: params.orderBy,
 *         skip: params.skip,
 *         take: params.take,
 *       })
 *       return users
 *     },
 *     async count(params) {
 *       return await DB.user.count({ where: params.where })
 *     }
 *   })(request)
 * })
 * ```
 */

import type { IServerSideDatasource, IServerSideGetRowsParams } from 'ag-grid-enterprise'
import { z } from 'zod'

// ============================================================================
// Core Types - Matching AG Grid's Official API
// ============================================================================

/**
 * Column configuration from AG Grid
 */
export interface AGGridColumn {
	id: string
	displayName: string
	field?: string
	aggFunc?: string
}

/**
 * Sort configuration
 */
export interface AGGridSort {
	colId: string
	sort: 'asc' | 'desc'
}

/**
 * Filter model from AG Grid
 * This is a simplified type - actual filters can be more complex
 */
export type AGGridFilterModel = Record<string, unknown>

/**
 * Request parameters sent from AG Grid to the data fetcher
 */
export interface AGGridRequest {
	/** Starting row index (0-based) */
	startRow?: number
	/** Ending row index (exclusive) */
	endRow?: number
	/** Current filter configuration */
	filterModel?: AGGridFilterModel
	/** Current sort configuration */
	sortModel: AGGridSort[]
	/** Columns being used for row grouping */
	rowGroupCols: AGGridColumn[]
	/** Current group keys for drill-down */
	groupKeys: string[]
	/** Columns with aggregation functions */
	valueCols: AGGridColumn[]
	/** Columns being pivoted */
	pivotCols: AGGridColumn[]
	/** Whether pivot mode is enabled */
	pivotMode: boolean
}

/**
 * Response from the data fetcher back to AG Grid
 */
export interface AGGridResponse<TData = unknown> {
	/** The row data for this request */
	rows: TData[]
	/**
	 * Total number of rows available (for pagination)
	 * - For leaf-level data: total count matching the filter
	 * - For group rows: number of groups at this level
	 * - If undefined, AG Grid assumes all rows have been loaded
	 */
	lastRow?: number
	/** Optional metadata for group levels */
	groupLevelInfo?: unknown
	/** Pivot result fields (for pivot mode) */
	pivotResultFields?: string[]
}

/**
 * Data fetcher function type
 * Implement this to connect AG Grid to your backend
 */
export type AGGridDataFetcher<TData = unknown> = (request: AGGridRequest) => Promise<AGGridResponse<TData>>

/**
 * Options for datasource creation
 */
export interface AGGridDatasourceOptions {
	/** Called when a request fails */
	onError?: (error: unknown) => void
	/** Called before each request is made */
	onBeforeRequest?: (request: AGGridRequest) => void
	/** Called after each successful response */
	onAfterResponse?: (response: AGGridResponse) => void
	/** Enable debug logging */
	debug?: boolean
}

// ============================================================================
// Zod Schema for Remote Functions
// ============================================================================

/**
 * Zod schema for AG Grid column configuration
 */
export const agGridColumnSchema = z.object({
	id: z.string(),
	displayName: z.string(),
	field: z.string().optional(),
	aggFunc: z.string().optional(),
})

/**
 * Zod schema for AG Grid sort configuration
 */
export const agGridSortSchema = z.object({
	colId: z.string(),
	sort: z.enum(['asc', 'desc']),
})

/**
 * Zod schema for AG Grid request
 * Use this in your remote function schema: query(agGridRequestSchema, async (request) => ...)
 */
export const agGridRequestSchema = z.object({
	startRow: z.number().optional(),
	endRow: z.number().optional(),
	filterModel: z.record(z.unknown()).optional(),
	sortModel: z.array(agGridSortSchema),
	rowGroupCols: z.array(agGridColumnSchema),
	groupKeys: z.array(z.string()),
	valueCols: z.array(agGridColumnSchema),
	pivotCols: z.array(agGridColumnSchema),
	pivotMode: z.boolean(),
})

// ============================================================================
// Server-Side Query Building API
// ============================================================================

/**
 * Parsed query parameters from AG Grid request
 * This is what you'll use to query your database
 */
export interface AGGridQueryParams<TWhereInput = Record<string, unknown>> {
	/** WHERE clause for filtering */
	where: TWhereInput
	/** ORDER BY clause for sorting (use Record<string, unknown>[] for Prisma compatibility) */
	orderBy: Record<string, unknown>[]
	/** Number of rows to skip (for pagination) */
	skip: number
	/** Number of rows to take (for pagination) */
	take: number
	/** Current grouping level (for row grouping) */
	groupLevel: number
	/** Group keys for drill-down */
	groupKeys: string[]
	/** Column being grouped at current level */
	groupColumn?: AGGridColumn
	/** Whether this is a group request or leaf data request */
	isGroupRequest: boolean
}

/**
 * Configuration for a computed/virtual field
 *
 * Use this ONLY for truly computed/calculated values, not for simple nested relations.
 *
 * For nested relations (e.g., showing 'location.name'), use dot notation directly in
 * your column definitions instead:
 *   { field: 'location.name', headerName: 'Location' }
 *
 * computedFields are for complex calculations like:
 * - Week ending dates calculated from another date field
 * - Full names concatenated from firstName + lastName
 * - Custom aggregations or transformations
 */
export interface ComputedField<TRecord = unknown, TWhereInput = Record<string, unknown>> {
	/** Column ID in AG Grid */
	columnId: string
	/**
	 * Database field to use for sorting/filtering (for simple nested fields)
	 * Only use this with computedFields if you need a custom field name.
	 * Otherwise, use dot notation directly in column definitions.
	 */
	dbField?: string
	/**
	 * Custom function to compute the value for display
	 * Required for complex calculations.
	 */
	valueGetter?: (record: TRecord) => unknown
	/**
	 * Custom filter handler
	 * Required for complex computed fields that need custom filter logic.
	 */
	filterHandler?: (filterValue: unknown, where: TWhereInput) => void
	/**
	 * Custom group filter handler
	 * Required for complex computed fields that need custom grouping logic.
	 */
	groupHandler?: (groupKey: string, where: TWhereInput) => void
}

/**
 * Configuration for AG Grid query builder
 */
export interface AGGridQueryConfig<TRecord = unknown, TWhereInput = Record<string, unknown>> {
	/** Function to fetch data rows */
	fetch: (params: AGGridQueryParams<TWhereInput>) => Promise<TRecord[]>
	/** Function to count total rows */
	count: (params: AGGridQueryParams<TWhereInput>) => Promise<number>
	/** Optional: Computed/virtual fields configuration */
	computedFields?: ComputedField<TRecord, TWhereInput>[]
	/** Optional: Default sort when no sort specified */
	defaultSort?: Record<string, 'asc' | 'desc'>
	/** Optional: Transform where clause before query */
	transformWhere?: (where: TWhereInput, request: AGGridRequest) => TWhereInput
}

// ============================================================================
// Main Server-Side API
// ============================================================================

/**
 * Creates an AG Grid query handler for server-side data fetching
 *
 * This is the main server-side API. Use this in your remote functions or API endpoints
 * to handle AG Grid requests with any database/data source.
 *
 * @param config - Configuration for data fetching and field mappings
 * @returns Function that processes AG Grid requests and returns responses
 *
 * @example Basic Prisma Usage
 * ```typescript
 * export const getUsersPaginated = query(agGridRequestSchema, async (request) => {
 *   return await createAGGridQuery({
 *     async fetch(params) {
 *       return await DB.user.findMany({
 *         where: params.where,
 *         orderBy: params.orderBy,
 *         skip: params.skip,
 *         take: params.take,
 *       })
 *     },
 *     async count(params) {
 *       return await DB.user.count({ where: params.where })
 *     },
 *     defaultSort: { createdAt: 'desc' }
 *   })(request)
 * })
 * ```
 *
 * @example With Nested Relations (Use Dot Notation)
 * ```typescript
 * // Server-side - just include the relation
 * return await createAGGridQuery({
 *   async fetch(params) {
 *     return await DB.intervention.findMany({
 *       where: params.where,
 *       orderBy: params.orderBy,
 *       skip: params.skip,
 *       take: params.take,
 *       include: { location: true }
 *     })
 *   },
 *   async count(params) {
 *     return await DB.intervention.count({ where: params.where })
 *   }
 * })(request)
 *
 * // Client-side - use dot notation in column definitions
 * const columnDefs = [
 *   { field: 'id' },
 *   { field: 'location.name', headerName: 'Location', filter: 'agTextColumnFilter' },
 * ]
 * // That's it! Auto-handles display, filtering, sorting, and grouping
 * ```
 *
 * @example With Computed Fields (Complex Calculations)
 * ```typescript
 * return await createAGGridQuery({
 *   async fetch(params) {
 *     return await DB.intervention.findMany({
 *       where: params.where,
 *       orderBy: params.orderBy,
 *       skip: params.skip,
 *       take: params.take,
 *     })
 *   },
 *   async count(params) {
 *     return await DB.intervention.count({ where: params.where })
 *   },
 *   computedFields: [
 *     {
 *       // Complex computed field - provide custom handlers
 *       columnId: 'weekEnding',
 *       valueGetter: (record) => calculateWeekEnding(record.date),
 *       filterHandler: (filterValue, where) => {
 *         // Custom filter logic for week ending
 *       }
 *     }
 *   ]
 * })(request)
 * ```
 */
export function createAGGridQuery<TRecord = unknown, TWhereInput = Record<string, unknown>>(
	config: AGGridQueryConfig<TRecord, TWhereInput>,
) {
	return async (request: AGGridRequest): Promise<AGGridResponse<TRecord>> => {
		const { startRow = 0, endRow = 100, filterModel, sortModel, rowGroupCols = [], groupKeys = [] } = request

		// Determine if we're handling groups or leaf data
		const isGroupRequest = rowGroupCols.length > 0 && groupKeys.length < rowGroupCols.length
		const groupLevel = groupKeys.length
		const groupColumn = isGroupRequest ? rowGroupCols[groupLevel] : undefined

		// Build WHERE clause
		let where: TWhereInput = {} as TWhereInput

		// Apply group keys (drill-down filters)
		if (groupKeys.length > 0) {
			for (let i = 0; i < groupKeys.length; i++) {
				const col = rowGroupCols[i]
				const key = groupKeys[i]
				// Normalize date strings to ISO-8601 format for Prisma
				const normalizedKey = normalizeValue(key)

				const computedField = config.computedFields?.find((cf) => cf.columnId === col.id)
				if (computedField?.groupHandler) {
					// Use custom group handler (pass normalized key)
					computedField.groupHandler(normalizedKey as string, where)
				} else if (computedField?.dbField) {
					// Auto-handle nested fields (e.g., 'location.name')
					if (computedField.dbField.includes('.')) {
						applyNestedFilter(where, computedField.dbField, normalizedKey)
					} else {
						;(where as Record<string, unknown>)[computedField.dbField] = normalizedKey
					}
				} else if (col.id.includes('.')) {
					// Auto-handle nested fields from column id (e.g., 'location.name')
					applyNestedFilter(where, col.id, normalizedKey)
				} else {
					;(where as Record<string, unknown>)[col.id] = normalizedKey
				}
			}
		}

		// Apply filters
		if (filterModel) {
			for (const [columnId, filterValue] of Object.entries(filterModel)) {
				if (!filterValue) continue

				const computedField = config.computedFields?.find((cf) => cf.columnId === columnId)
				if (computedField?.filterHandler) {
					// Use custom filter handler
					computedField.filterHandler(filterValue, where)
				} else if (computedField?.dbField) {
					// Auto-handle using dbField
					applyFilterToField(where, computedField.dbField, filterValue)
				} else {
					applyFilterToField(where, columnId, filterValue)
				}
			}
		}

		// Apply custom where transformations
		if (config.transformWhere) {
			where = config.transformWhere(where, request)
		}

		// Build ORDER BY clause
		const orderBy: Record<string, unknown>[] = []
		if (sortModel && sortModel.length > 0) {
			for (const sort of sortModel) {
				const computedField = config.computedFields?.find((cf) => cf.columnId === sort.colId)
				if (computedField?.dbField) {
					orderBy.push(createNestedSort(computedField.dbField, sort.sort))
				} else {
					orderBy.push({ [sort.colId]: sort.sort })
				}
			}
		} else if (config.defaultSort) {
			for (const [field, direction] of Object.entries(config.defaultSort)) {
				orderBy.push({ [field]: direction })
			}
		}

		// Build query params
		const queryParams: AGGridQueryParams<TWhereInput> = {
			where,
			orderBy,
			skip: startRow,
			take: endRow - startRow,
			groupLevel,
			groupKeys,
			groupColumn,
			isGroupRequest,
		}

		if (isGroupRequest) {
			// Fetch all records to compute groups (for now - can be optimized)
			const allRecords = await config.fetch({ ...queryParams, skip: 0, take: 999999 })
			const groupMap = new Map<string, number>()

			for (const record of allRecords) {
				let groupValue = ''

				const computedField = config.computedFields?.find((cf) => cf.columnId === groupColumn!.id)
				if (computedField?.valueGetter) {
					// Use custom value getter
					groupValue = String(computedField.valueGetter(record) ?? '')
				} else if (computedField?.dbField) {
					// Auto-extract nested value (e.g., 'location.name')
					groupValue = String(getNestedValue(record, computedField.dbField) ?? '')
				} else {
					groupValue = String((record as Record<string, unknown>)[groupColumn!.id] ?? '')
				}

				if (groupValue) {
					groupMap.set(groupValue, (groupMap.get(groupValue) || 0) + 1)
				}
			}

			// Convert to group rows
			const groups = Array.from(groupMap.entries())
				.map(([key, count]) => ({
					[groupColumn!.id]: key,
					childCount: count,
				}))
				.sort((a, b) => String(a[groupColumn!.id]).localeCompare(String(b[groupColumn!.id])))

			const paginatedGroups = groups.slice(startRow, endRow)

			return {
				rows: paginatedGroups as TRecord[],
				lastRow: groups.length,
			}
		} else {
			// Fetch leaf data
			const [rows, totalCount] = await Promise.all([config.fetch(queryParams), config.count(queryParams)])

			// Apply computed field value getters
			const mappedRows = rows.map((record) => {
				const mapped = { ...record }
				if (config.computedFields) {
					for (const computedField of config.computedFields) {
						if (computedField.valueGetter) {
							// Use custom value getter
							;(mapped as Record<string, unknown>)[computedField.columnId] = computedField.valueGetter(record)
						} else if (computedField.dbField) {
							// Auto-extract nested value (e.g., 'location.name' -> record.location.name)
							;(mapped as Record<string, unknown>)[computedField.columnId] = getNestedValue(
								record,
								computedField.dbField,
							)
						}
					}
				}
				return mapped
			})

			return {
				rows: mappedRows,
				lastRow: groupKeys.length > 0 ? mappedRows.length : totalCount,
			}
		}
	}
}

// ============================================================================
// Helper Functions for Query Building
// ============================================================================

/**
 * Detects if a string is a JavaScript Date string
 * Examples: "Sat Oct 18 2025 18:00:00 GMT-0600", "2025-10-18T00:00:00.000Z"
 */
function isDateString(value: unknown): boolean {
	if (typeof value !== 'string') return false
	const date = new Date(value)
	return !isNaN(date.getTime())
}

/**
 * Converts a JavaScript Date string or Date object to ISO-8601 format
 * This ensures Prisma receives dates in the correct format
 */
function toISOString(value: unknown): string | unknown {
	if (value instanceof Date) {
		return value.toISOString()
	}
	if (typeof value === 'string' && isDateString(value)) {
		return new Date(value).toISOString()
	}
	return value
}

/**
 * Normalizes a value for database queries (converts dates to ISO-8601)
 */
function normalizeValue(value: unknown): unknown {
	if (value instanceof Date || (typeof value === 'string' && isDateString(value))) {
		return toISOString(value)
	}
	if (Array.isArray(value)) {
		return value.map(normalizeValue)
	}
	if (value && typeof value === 'object') {
		const normalized: Record<string, unknown> = {}
		for (const [key, val] of Object.entries(value)) {
			normalized[key] = normalizeValue(val)
		}
		return normalized
	}
	return value
}

/**
 * Applies a filter to a field (handles nested fields)
 */
function applyFilterToField<TWhereInput>(where: TWhereInput, field: string, filterValue: unknown): void {
	if (!filterValue || typeof filterValue !== 'object') return

	const filter = filterValue as Record<string, unknown>

	// Text filter
	if ('filter' in filter && typeof filter.filter === 'string') {
		const normalizedFilter = normalizeValue(filter.filter)
		if (field.includes('.')) {
			applyNestedFilter(where, field, { contains: normalizedFilter, mode: 'insensitive' })
		} else {
			;(where as Record<string, unknown>)[field] = { contains: normalizedFilter, mode: 'insensitive' }
		}
	}

	// Set filter
	if ('values' in filter && Array.isArray(filter.values)) {
		const normalizedValues = normalizeValue(filter.values)
		if (field.includes('.')) {
			applyNestedFilter(where, field, { in: normalizedValues })
		} else {
			;(where as Record<string, unknown>)[field] = { in: normalizedValues }
		}
	}

	// Date filter
	if ('dateFrom' in filter || 'dateTo' in filter) {
		const dateCondition: Record<string, string> = {}
		if (filter.dateFrom) {
			const date = new Date(filter.dateFrom as string)
			dateCondition.gte = date.toISOString()
		}
		if (filter.dateTo) {
			const date = new Date(filter.dateTo as string)
			dateCondition.lte = date.toISOString()
		}

		if (field.includes('.')) {
			applyNestedFilter(where, field, dateCondition)
		} else {
			;(where as Record<string, unknown>)[field] = dateCondition
		}
	}
}

/**
 * Applies a nested filter (e.g., 'location.name')
 */
function applyNestedFilter<TWhereInput>(where: TWhereInput, path: string, value: unknown): void {
	const [relation, field] = path.split('.')
	const whereObj = where as Record<string, unknown>

	if (!whereObj[relation]) {
		whereObj[relation] = {}
	}

	;(whereObj[relation] as Record<string, unknown>)[field] = value
}

/**
 * Creates a nested sort object (e.g., 'location.name' -> { location: { name: 'asc' } })
 */
function createNestedSort(path: string, direction: 'asc' | 'desc'): Record<string, unknown> {
	if (!path.includes('.')) {
		return { [path]: direction }
	}

	const [relation, field] = path.split('.')
	return { [relation]: { [field]: direction } }
}

/**
 * Gets a nested value from an object (e.g., 'location.name' from record)
 */
function getNestedValue<T>(obj: T, path: string): unknown {
	const parts = path.split('.')
	let value: unknown = obj
	for (const part of parts) {
		if (value && typeof value === 'object') {
			value = (value as Record<string, unknown>)[part]
		} else {
			return undefined
		}
	}
	return value
}

// ============================================================================
// Client-Side Datasource Creation
// ============================================================================

/**
 * Creates an AG Grid server-side datasource from a data fetcher function
 *
 * This is the main entry point for implementing SSRM. Simply provide a function
 * that fetches data based on AG Grid's request, and this handles all the
 * AG Grid datasource protocol.
 *
 * @param fetcher - Function that fetches data based on AG Grid's request
 * @param options - Optional configuration for error handling and logging
 * @returns IServerSideDatasource compatible with AG Grid
 *
 * @example
 * ```typescript
 * const datasource = createAGGridDatasource(async (request) => {
 *   const { startRow, endRow, filterModel, sortModel } = request
 *
 *   // Your data fetching logic here
 *   const data = await fetchFromAPI({
 *     offset: startRow,
 *     limit: endRow - startRow,
 *     filters: filterModel,
 *     sorts: sortModel
 *   })
 *
 *   return {
 *     rows: data.items,
 *     lastRow: data.total
 *   }
 * })
 * ```
 */
export function createAGGridDatasource<TData = unknown>(
	fetcher: AGGridDataFetcher<TData>,
	options: AGGridDatasourceOptions = {},
): IServerSideDatasource<TData> {
	const { onError, onBeforeRequest, onAfterResponse, debug = false } = options

	return {
		getRows: async (params: IServerSideGetRowsParams<TData>) => {
			try {
				// Extract request details from AG Grid
				const request: AGGridRequest = {
					startRow: params.request.startRow,
					endRow: params.request.endRow,
					filterModel: params.request.filterModel as AGGridFilterModel,
					sortModel: params.request.sortModel as AGGridSort[],
					rowGroupCols: params.request.rowGroupCols as AGGridColumn[],
					groupKeys: params.request.groupKeys,
					valueCols: params.request.valueCols as AGGridColumn[],
					pivotCols: params.request.pivotCols as AGGridColumn[],
					pivotMode: params.request.pivotMode,
				}

				if (debug) {
					console.log('[AG Grid SSRM] Request:', request)
				}

				// Call lifecycle hook
				if (onBeforeRequest) {
					onBeforeRequest(request)
				}

				// Fetch data using provided fetcher
				const response = await fetcher(request)

				if (debug) {
					console.log('[AG Grid SSRM] Response:', {
						rowCount: response.rows.length,
						lastRow: response.lastRow,
					})
				}

				// Call lifecycle hook
				if (onAfterResponse) {
					onAfterResponse(response)
				}

				// Send success response to AG Grid
				params.success({
					rowData: response.rows,
					rowCount: response.lastRow,
					groupLevelInfo: response.groupLevelInfo,
					pivotResultFields: response.pivotResultFields,
				})
			} catch (error) {
				if (debug) {
					console.error('[AG Grid SSRM] Error:', error)
				}

				if (onError) {
					onError(error)
				}

				// Notify AG Grid of failure
				params.fail()
			}
		},
	}
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a simple REST API fetcher for AG Grid
 *
 * @param url - API endpoint URL
 * @param options - Additional fetch options
 * @returns Data fetcher function
 *
 * @example
 * ```typescript
 * const fetcher = createRESTFetcher('/api/data', {
 *   headers: {
 *     'Authorization': 'Bearer token'
 *   }
 * })
 *
 * const datasource = createAGGridDatasource(fetcher)
 * ```
 */
export function createRESTFetcher<TData = unknown>(url: string, options: RequestInit = {}): AGGridDataFetcher<TData> {
	return async (request: AGGridRequest): Promise<AGGridResponse<TData>> => {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			body: JSON.stringify(request),
			...options,
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return response.json()
	}
}

/**
 * Creates a remote function fetcher (for SvelteKit remote functions)
 *
 * @param remoteFn - Remote function that accepts AG Grid request
 * @returns Data fetcher function
 *
 * @example
 * ```typescript
 * import { getDataPaginated } from './data.remote'
 *
 * const fetcher = createRemoteFetcher(getDataPaginated)
 * const datasource = createAGGridDatasource(fetcher)
 * ```
 */
export function createRemoteFetcher<TData = unknown>(
	remoteFn: (request: AGGridRequest) => Promise<AGGridResponse<TData>>,
): AGGridDataFetcher<TData> {
	return remoteFn
}

/**
 * Transforms AG Grid filter model to query parameters
 * Useful for converting filters to URL query params or SQL WHERE clauses
 *
 * @param filterModel - AG Grid filter model
 * @returns Object suitable for query parameters
 *
 * @example
 * ```typescript
 * const params = transformFiltersToQueryParams(request.filterModel)
 * // { name: 'John', age_gt: 25 }
 * ```
 */
export function transformFiltersToQueryParams(filterModel: AGGridFilterModel | undefined): Record<string, unknown> {
	if (!filterModel) return {}

	const params: Record<string, unknown> = {}

	for (const [field, filter] of Object.entries(filterModel)) {
		if (!filter || typeof filter !== 'object') continue

		const filterObj = filter as Record<string, unknown>

		// Text filter
		if ('filter' in filterObj && typeof filterObj.filter === 'string') {
			params[field] = filterObj.filter
		}

		// Set filter (multiple values)
		if ('values' in filterObj && Array.isArray(filterObj.values)) {
			params[`${field}_in`] = filterObj.values
		}

		// Number/Date filter with type
		if ('type' in filterObj && 'filter' in filterObj) {
			const type = filterObj.type as string
			const value = filterObj.filter

			switch (type) {
				case 'equals':
					params[field] = value
					break
				case 'notEqual':
					params[`${field}_ne`] = value
					break
				case 'lessThan':
					params[`${field}_lt`] = value
					break
				case 'lessThanOrEqual':
					params[`${field}_lte`] = value
					break
				case 'greaterThan':
					params[`${field}_gt`] = value
					break
				case 'greaterThanOrEqual':
					params[`${field}_gte`] = value
					break
				case 'contains':
					params[`${field}_contains`] = value
					break
				case 'notContains':
					params[`${field}_not_contains`] = value
					break
				case 'startsWith':
					params[`${field}_starts`] = value
					break
				case 'endsWith':
					params[`${field}_ends`] = value
					break
			}
		}

		// Date range filter
		if ('dateFrom' in filterObj && 'dateTo' in filterObj) {
			if (filterObj.dateFrom) params[`${field}_gte`] = filterObj.dateFrom
			if (filterObj.dateTo) params[`${field}_lte`] = filterObj.dateTo
		}
	}

	return params
}

/**
 * Transforms AG Grid sort model to query parameters
 *
 * @param sortModel - AG Grid sort model
 * @returns Object suitable for query parameters
 *
 * @example
 * ```typescript
 * const params = transformSortsToQueryParams(request.sortModel)
 * // { sort: 'name', order: 'asc' } or { sort: ['name:asc', 'age:desc'] }
 * ```
 */
export function transformSortsToQueryParams(
	sortModel: AGGridSort[] | undefined,
	format: 'single' | 'array' | 'multiple' = 'single',
): Record<string, unknown> {
	if (!sortModel || sortModel.length === 0) return {}

	if (format === 'single') {
		// Return first sort only: { sort: 'field', order: 'asc' }
		const firstSort = sortModel[0]
		return {
			sort: firstSort.colId,
			order: firstSort.sort,
		}
	} else if (format === 'array') {
		// Return array of 'field:direction': { sort: ['name:asc', 'age:desc'] }
		return {
			sort: sortModel.map((s) => `${s.colId}:${s.sort}`),
		}
	} else {
		// Return multiple params: { sort_name: 'asc', sort_age: 'desc' }
		const params: Record<string, string> = {}
		for (const sort of sortModel) {
			params[`sort_${sort.colId}`] = sort.sort
		}
		return params
	}
}

/**
 * Checks if the current request is for leaf-level data (not groups)
 *
 * @param request - AG Grid request
 * @returns true if requesting leaf data, false if requesting groups
 */
export function isLeafDataRequest(request: AGGridRequest): boolean {
	const hasGrouping = request.rowGroupCols && request.rowGroupCols.length > 0
	if (!hasGrouping) return true

	const currentGroupLevel = request.groupKeys?.length ?? 0
	return currentGroupLevel >= request.rowGroupCols.length
}

/**
 * Gets the current grouping level (0-based)
 *
 * @param request - AG Grid request
 * @returns Current group level, or -1 if not grouping
 */
export function getCurrentGroupLevel(request: AGGridRequest): number {
	if (!request.rowGroupCols || request.rowGroupCols.length === 0) return -1
	return request.groupKeys?.length ?? 0
}

/**
 * Gets the column being grouped at the current level
 *
 * @param request - AG Grid request
 * @returns Column configuration for current group level, or undefined
 */
export function getCurrentGroupColumn(request: AGGridRequest): AGGridColumn | undefined {
	const level = getCurrentGroupLevel(request)
	if (level < 0 || !request.rowGroupCols) return undefined
	return request.rowGroupCols[level]
}

// ============================================================================
// Default Grid Configuration
// ============================================================================

/**
 * Default column definition for SSRM grids
 */
export const defaultSSRMColDef: import('ag-grid-community').ColDef = {
	sortable: true,
	resizable: true,
	filter: true,
	floatingFilter: true,
	enableRowGroup: true,
	flex: 1,
	menuTabs: ['filterMenuTab', 'generalMenuTab'],
}

/**
 * Default grid options for SSRM
 */
export const defaultSSRMGridOptions: Partial<import('ag-grid-community').GridOptions> = {
	rowModelType: 'serverSide',
	pagination: true,
	paginationPageSize: 100,
	cacheBlockSize: 100,
	rowGroupPanelShow: 'always',
	groupDisplayType: 'groupRows',
	animateRows: true,
}

/**
 * Predefined filter configurations for common column types
 */
export const filterConfigs = {
	/** Text column with text filter */
	text: {
		filter: 'agTextColumnFilter',
		filterParams: {
			buttons: ['clear'],
			suppressAndOrCondition: true,
		},
	},

	/** Number column with number filter */
	number: {
		filter: 'agNumberColumnFilter',
		filterParams: {
			buttons: ['clear'],
			suppressAndOrCondition: true,
		},
	},

	/** Date column with date filter */
	date: {
		filter: 'agDateColumnFilter',
		filterParams: {
			buttons: ['clear'],
			suppressAndOrCondition: true,
		},
	},

	/** Date range filter (for start dates) */
	startDate: {
		filter: 'agDateColumnFilter',
		filterParams: {
			buttons: ['clear'],
			suppressAndOrCondition: true,
			filterOptions: ['greaterThan', 'inRange'],
		},
	},

	/** Date range filter (for end dates) */
	endDate: {
		filter: 'agDateColumnFilter',
		filterParams: {
			buttons: ['clear'],
			suppressAndOrCondition: true,
			filterOptions: ['lessThan', 'inRange'],
		},
	},

	/** Set filter (for categories) */
	set: {
		filter: 'agSetColumnFilter',
		filterParams: {
			buttons: ['clear'],
		},
	},
} as const
