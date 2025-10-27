import type { IServerSideDatasource, IServerSideGetRowsParams } from 'ag-grid-enterprise'
import { z } from 'zod'

// ============================================================================
// Core Types - Matching AG Grid's Official API
// ============================================================================

// Internal types - not exported
type AGGridColumn = {
	id: string
	displayName: string
	field?: string
	aggFunc?: string
}

type AGGridSort = {
	colId: string
	sort: 'asc' | 'desc'
}

/**
 * Request parameters sent from AG Grid to the data fetcher
 */
export type AGGridRequest = {
	/** Starting row index (0-based) */
	startRow?: number
	/** Ending row index (exclusive) */
	endRow?: number
	/** Current filter configuration */
	filterModel?: Record<string, unknown>
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
export type AGGridResponse<TData = any> = {
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

// ============================================================================
// Zod Schema for Remote Functions
// ============================================================================

// Internal schemas
const agGridColumnSchema = z.object({
	id: z.string(),
	displayName: z.string(),
	field: z.string().optional(),
	aggFunc: z.string().optional(),
})

const agGridSortSchema = z.object({
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
	filterModel: z.record(z.string(), z.any()).optional(),
	sortModel: z.array(agGridSortSchema),
	rowGroupCols: z.array(agGridColumnSchema),
	groupKeys: z.array(z.string()),
	valueCols: z.array(agGridColumnSchema),
	pivotCols: z.array(agGridColumnSchema),
	pivotMode: z.boolean(),
})

/**
 * Default AG Grid request object (initial/empty state)
 * Use this as a fallback or initial value when no request is provided
 */
export const defaultAGGridRequest: AGGridRequest = {
	startRow: 0,
	endRow: 100,
	filterModel: {},
	sortModel: [],
	rowGroupCols: [],
	groupKeys: [],
	valueCols: [],
	pivotCols: [],
	pivotMode: false,
}

// ============================================================================
// Parameter Storage API
// ============================================================================

/**
 * Storage for AG Grid request parameters per user and table
 * Key format: `agGridParams:${userId}:${tableKey}`
 */
const paramsStorage = new Map<string, AGGridRequest>()

/**
 * Generates a storage key for AG Grid parameters
 */
function getStorageKey(userId: string | number, tableKey: string): string {
	return `agGridParams:${userId}:${tableKey}`
}

/**
 * Saves AG Grid request parameters for a specific user and table
 *
 * Call this in your grid query function to save the current filter, sort, and grouping state
 * on every request. This allows mutations to restore the user's view when refreshing the grid.
 *
 * @param tableKey - Unique identifier for the table/grid (e.g., 'users-table', 'interventions-grid')
 * @param userId - User identifier (string or number)
 * @param params - AG Grid request parameters to save (filters, sorts, groups, pagination)
 *
 * @example Grid Query - Save parameters on every request
 * ```typescript
 * export const getUsersGrid = query(agGridRequestSchema, async (request) => {
 *   const user = await getActiveUser()
 *
 *   // Save parameters on every grid request
 *   saveParams('users-table', user.id, request)
 *
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
 *   })(request)
 * })
 * ```
 */
export function saveParams(tableKey: string, userId: string | number, params: AGGridRequest): void {
	const key = getStorageKey(userId, tableKey)
	paramsStorage.set(key, params)
}

/**
 * Fetches previously saved AG Grid request parameters for a specific user and table
 *
 * Returns the last saved parameters, or the default AG Grid request if none exist.
 * Use this in mutation commands (create/update/delete) to refresh the grid with the
 * user's last used filters, sorts, and grouping.
 *
 * @param tableKey - Unique identifier for the table/grid (e.g., 'users-table', 'interventions-grid')
 * @param userId - User identifier (string or number)
 * @returns Saved AG Grid request parameters, or `defaultAGGridRequest` if none exist
 *
 * @example Create Command - Refresh grid with last used filters
 * ```typescript
 * export const createUser = command(userSchema, async (data) => {
 *   const user = await getActiveUser()
 *
 *   // Create the new user
 *   const newUser = await DB.user.create({ data })
 *
 *   // Fetch last used parameters (or defaults if none exist)
 *   const lastParams = fetchParams('users-table', user.id)
 *
 *   // Refresh the grid query with last used filters/sorts
 *   await getUsersGrid(lastParams).refresh()
 *
 *   return newUser
 * })
 * ```
 *
 * @example Update Command - Refresh grid with last used filters
 * ```typescript
 * export const updateUser = command(
 *   z.object({ id: z.number(), data: userSchema.partial() }),
 *   async ({ id, data }) => {
 *     const user = await getActiveUser()
 *
 *     // Update the user
 *     const updatedUser = await DB.user.update({ where: { id }, data })
 *
 *     // Fetch last used parameters (or defaults if none exist)
 *     const lastParams = fetchParams('users-table', user.id)
 *
 *     // Refresh the grid query with last used filters/sorts
 *     await getUsersGrid(lastParams).refresh()
 *
 *     return updatedUser
 *   }
 * )
 * ```
 *
 * @example Multiple Query Refresh - Refresh related queries in parallel
 * ```typescript
 * export const deleteUser = command(z.number(), async (id) => {
 *   const user = await getActiveUser()
 *   const deletedUser = await DB.user.findUnique({ where: { id } })
 *
 *   await DB.user.delete({ where: { id } })
 *
 *   const lastParams = fetchParams('users-table', user.id)
 *
 *   // Refresh multiple queries in parallel
 *   await Promise.all([
 *     getUsersByDepartment(deletedUser.departmentId).refresh(),
 *     getUsersGrid(lastParams).refresh(),
 *   ])
 *
 *   return deletedUser
 * })
 * ```
 */
export function fetchParams(tableKey: string, userId: string | number): AGGridRequest {
	const key = getStorageKey(userId, tableKey)
	return paramsStorage.get(key) || defaultAGGridRequest
}

// ============================================================================
// Server-Side Query Building API
// ============================================================================

/**
 * Prisma-style filter operators for different field types
 */
type PrismaFilter<T> = T extends string
	?
			| T
			| {
					equals?: T
					not?: T
					in?: T[]
					notIn?: T[]
					contains?: T
					startsWith?: T
					endsWith?: T
					mode?: 'default' | 'insensitive'
			  }
	: T extends number
		? T | { equals?: T; not?: T; in?: T[]; notIn?: T[]; lt?: T; lte?: T; gt?: T; gte?: T }
		: T extends Date
			? T | { equals?: T; not?: T; in?: T[]; notIn?: T[]; lt?: T; lte?: T; gt?: T; gte?: T }
			: T extends boolean
				? T | { equals?: T; not?: T }
				: T extends object
					? T | Partial<{ [K in keyof T]?: PrismaFilter<T[K]> }>
					: T | { equals?: T; not?: T; in?: T[]; notIn?: T[] }

/**
 * Transform return type that constrains field names to TRecord keys
 * and provides proper typing for Prisma filter operators based on field types.
 * Supports OR and AND operators for complex queries.
 */
type TransformResult<TRecord> = {
	[K in keyof TRecord]?: PrismaFilter<TRecord[K]>
} & {
	/** OR operator - at least one condition must match */
	OR?: Array<{
		[K in keyof TRecord]?: PrismaFilter<TRecord[K]>
	}>
	/** AND operator - all conditions must match */
	AND?: Array<{
		[K in keyof TRecord]?: PrismaFilter<TRecord[K]>
	}>
	/** NOT operator - inverts the condition */
	NOT?: {
		[K in keyof TRecord]?: PrismaFilter<TRecord[K]>
	}
}

/**
 * Parsed query parameters from AG Grid request
 * This is what you'll use to query your database
 */
type AGGridQueryParams = {
	/** WHERE clause for filtering */
	where: Record<string, any>
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
 *
 * @example Week Ending Date
 * ```typescript
 * {
 *   columnId: 'weekEnding',
 *   valueGetter: (record) => getWeekEndingDate(record.dateOfEngagement),
 *   transform: (date) => {
 *     const weekStart = new Date(date)
 *     weekStart.setUTCDate(date.getUTCDate() - 6)
 *     return { dateOfEngagement: { gte: weekStart, lte: date } }
 *   }
 * }
 * ```
 *
 * @example Full Name (Multi-field with OR)
 * ```typescript
 * {
 *   columnId: 'fullName',
 *   valueGetter: (record) => `${record.firstName} ${record.lastName}`,
 *   transform: (name) => {
 *     const [first, last] = name.split(' ')
 *     return {
 *       OR: [
 *         { firstName: { contains: first, mode: 'insensitive' } },
 *         { lastName: { contains: last || first, mode: 'insensitive' } }
 *       ]
 *     }
 *   }
 * }
 * ```
 */
export type ComputedField<TRecord = any, TValue = any> = {
	/** Column ID in AG Grid */
	columnId: string
	/**
	 * Custom function to compute the value for display
	 * Required for displaying the computed value.
	 *
	 * @param record - The database record (typed as TRecord)
	 * @returns The computed display value
	 */
	valueGetter: (record: TRecord) => TValue
	/**
	 * Transform function to map the computed value to database conditions.
	 * This is used for both filtering and grouping.
	 *
	 * The framework automatically:
	 * - Extracts the filter value from AG Grid's filter model
	 * - Handles different filter operations (equals, greaterThan, lessThan, inRange)
	 * - Applies the returned conditions to the WHERE clause
	 *
	 * @param value - The computed value to transform (matches what valueGetter returns)
	 * @returns Partial WHERE clause with conditions for one or more database fields from TRecord
	 *
	 * @example Single field
	 * ```typescript
	 * transform: (date: Date) => ({
	 *   dateOfEngagement: { gte: weekStart, lte: weekEnd }
	 * })
	 * ```
	 *
	 * @example Multiple fields
	 * ```typescript
	 * transform: (name: string) => ({
	 *   firstName: { contains: firstName },
	 *   lastName: { contains: lastName }
	 * })
	 * ```
	 */
	transform: (value: TValue) => TransformResult<TRecord>
}

/**
 * Configuration for AG Grid query builder
 */
export type AGGridQueryConfig<TRecord = any> = {
	/** Function to fetch data rows */
	fetch: (params: AGGridQueryParams) => Promise<TRecord[]>
	/** Function to count total rows */
	count: (params: AGGridQueryParams) => Promise<number>
	/** Optional: Computed/virtual fields configuration */
	computedFields?: ComputedField<TRecord>[]
	/** Optional: Default sort when no sort specified */
	defaultSort?: Record<string, 'asc' | 'desc'>
	/** Optional: Transform where clause before query */
	transformWhere?: (where: Record<string, any>, request: AGGridRequest) => Record<string, any>
	/**
	 * Optional: Field names (or patterns) that should skip numeric normalization.
	 * Useful for fields that look numeric but should remain strings (e.g., ID fields, codes).
	 * Supports exact field names or RegExp patterns.
	 *
	 * @example
	 * ```typescript
	 * skipNormalization: ['jdeNumber', /jde/i, 'accountCode']
	 * ```
	 */
	skipNormalization?: (string | RegExp)[]
	/**
	 * Optional: Disable case-insensitive filtering.
	 * Set to true if your database doesn't support mode: 'insensitive' (e.g., MySQL, some SQLite configs).
	 * When true, text filters will use exact case matching instead of case-insensitive matching.
	 *
	 * @default false
	 *
	 * @example
	 * ```typescript
	 * {
	 *   disableCaseInsensitive: true, // Use exact case matching
	 *   // ... other config
	 * }
	 * ```
	 */
	disableCaseInsensitive?: boolean
}

// ============================================================================
// Value Normalization Utilities
// ============================================================================

/**
 * Detects if a string is a JavaScript Date string
 * Examples: "Sat Oct 18 2025 18:00:00 GMT-0600", "2025-10-18T00:00:00.000Z"
 */
function isDateString(value: unknown): boolean {
	if (typeof value !== 'string') return false

	// Don't treat pure numbers as dates (e.g., "51.6" shouldn't become a date)
	if (/^-?\d+\.?\d*$/.test(value.trim())) return false

	// Check if it's a valid date string
	const date = new Date(value)
	if (isNaN(date.getTime())) return false

	// Additional validation: must contain date-like patterns
	// (year, month name, or ISO format)
	return /\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|GMT|UTC|T\d{2}:/i.test(value)
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
 * Normalizes a value for database queries (converts dates to ISO-8601, parses numeric strings, converts boolean strings)
 */
function normalizeValue(value: unknown, fieldName?: string, skipPatterns?: (string | RegExp)[]): unknown {
	// Handle dates (but not numeric strings that look like dates)
	if (value instanceof Date || (typeof value === 'string' && isDateString(value))) {
		return toISOString(value)
	}

	// Parse boolean strings to boolean (e.g., "true" -> true, "false" -> false)
	if (typeof value === 'string') {
		const trimmed = value.trim()
		if (trimmed === 'true') return true
		if (trimmed === 'false') return false

		// Parse numeric strings back to numbers (e.g., "51.6" -> 51.6)
		if (/^-?\d+\.?\d*$/.test(trimmed)) {
			// Skip conversion if field matches any skip pattern
			if (fieldName && skipPatterns) {
				const shouldSkip = skipPatterns.some((pattern) => {
					if (typeof pattern === 'string') {
						return fieldName === pattern
					}
					return pattern.test(fieldName)
				})
				if (shouldSkip) {
					return value
				}
			}
			const num = Number(trimmed)
			if (!isNaN(num)) {
				return num
			}
		}
	}

	if (Array.isArray(value)) {
		return value.map((v) => normalizeValue(v, fieldName, skipPatterns))
	}
	if (value && typeof value === 'object') {
		const normalized: Record<string, unknown> = {}
		for (const [key, val] of Object.entries(value)) {
			normalized[key] = normalizeValue(val, key, skipPatterns)
		}
		return normalized
	}
	return value
}

/**
 * Normalizes all values in an AG Grid request upfront
 * This includes filterModel, sortModel values, and groupKeys
 */
function normalizeRequest(request: AGGridRequest, skipPatterns?: (string | RegExp)[]): AGGridRequest {
	// We don't need to normalize the filter model, only grouping since all groupKeys are strings
	// Normalize filter model - map each column's filter with field context
	// let normalizedFilterModel: Record<string, unknown> | undefined
	// if (request.filterModel) {
	// 	normalizedFilterModel = {}
	// 	for (const [columnId, filterValue] of Object.entries(request.filterModel)) {
	// 		normalizedFilterModel[columnId] = normalizeValue(filterValue, columnId, skipPatterns)
	// 	}
	// }

	return {
		...request,
		// Normalize filter model
		filterModel: request.filterModel,
		// Normalize group keys
		groupKeys: request.groupKeys.map((key, index) => {
			const col = request.rowGroupCols[index]
			const fieldName = col?.field || col?.id
			return normalizeValue(key, fieldName, skipPatterns) as string
		}),
	}
}

// ============================================================================
// Nested Path Utilities
// ============================================================================

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

/**
 * Transforms flat objects with dotted keys into nested Prisma format
 * Works for both single objects (WHERE clauses) and arrays of objects (ORDER BY clauses)
 *
 * @example Single object (WHERE)
 * Input:  { 'location.name': 'Seattle', 'status': 'active' }
 * Output: { location: { name: 'Seattle' }, status: 'active' }
 *
 * @example Array of objects (ORDER BY)
 * Input:  [{ 'location.name': 'asc' }, { 'status': 'desc' }]
 * Output: [{ location: { name: 'asc' } }, { status: 'desc' }]
 */
function transformForPrisma<T extends Record<string, any> | Record<string, any>[]>(input: T): T {
	const transformObject = (obj: Record<string, any>): Record<string, any> => {
		const result: Record<string, any> = {}

		for (const [key, value] of Object.entries(obj)) {
			if (key.includes('.')) {
				// Handle nested field path
				const parts = key.split('.')

				// Build nested structure
				let current: any = result
				for (let i = 0; i < parts.length - 1; i++) {
					if (!current[parts[i]]) {
						current[parts[i]] = {}
					}
					current = current[parts[i]]
				}

				// Set the final field value
				current[parts[parts.length - 1]] = value
			} else {
				// Direct field
				result[key] = value
			}
		}

		return result
	}

	// Handle array input (ORDER BY)
	if (Array.isArray(input)) {
		return input.map(transformObject) as T
	}

	// Handle single object input (WHERE)
	return transformObject(input) as T
}

// ============================================================================
// Filter Type Handlers (matching AG Grid pattern)
// ============================================================================

/**
 * Handles text filters (contains, equals, startsWith, endsWith, etc.)
 */
function applyTextFilter(
	where: Record<string, any>,
	field: string,
	filter: Record<string, unknown>,
	disableCaseInsensitive?: boolean,
): void {
	const type = filter.type as string
	const value = filter.filter

	switch (type) {
		case 'equals':
			where[field] = value
			break
		case 'notEqual':
			where[field] = { not: value }
			break
		case 'contains':
			where[field] = disableCaseInsensitive ? { contains: value } : { contains: value, mode: 'insensitive' }
			break
		case 'notContains':
			where[field] = disableCaseInsensitive
				? { not: { contains: value } }
				: { not: { contains: value, mode: 'insensitive' } }
			break
		case 'startsWith':
			where[field] = disableCaseInsensitive ? { startsWith: value } : { startsWith: value, mode: 'insensitive' }
			break
		case 'endsWith':
			where[field] = disableCaseInsensitive ? { endsWith: value } : { endsWith: value, mode: 'insensitive' }
			break
		case 'blank':
		case 'empty':
			where[field] = null
			break
		case 'notBlank':
			where[field] = { not: null }
			break
		default:
			console.warn('Unknown text filter type:', type)
	}
}

/**
 * Handles number filters (equals, greaterThan, lessThan, inRange, etc.)
 */
function applyNumberFilter(where: Record<string, any>, field: string, filter: Record<string, unknown>): void {
	const type = filter.type as string
	const value = filter.filter
	const valueTo = filter.filterTo

	switch (type) {
		case 'equals':
			where[field] = value
			break
		case 'notEqual':
			where[field] = { not: value }
			break
		case 'greaterThan':
			where[field] = { gt: value }
			break
		case 'greaterThanOrEqual':
			where[field] = { gte: value }
			break
		case 'lessThan':
			where[field] = { lt: value }
			break
		case 'lessThanOrEqual':
			where[field] = { lte: value }
			break
		case 'inRange':
			where[field] = { gte: value, lte: valueTo }
			break
		case 'blank':
		case 'empty':
			where[field] = null
			break
		case 'notBlank':
			where[field] = { not: null }
			break
		default:
			console.warn('Unknown number filter type:', type)
	}
}

/**
 * Handles date filters (equals, greaterThan, lessThan, inRange, etc.)
 */
function applyDateFilter(where: Record<string, any>, field: string, filter: Record<string, unknown>): void {
	const type = filter.type as string
	let dateFrom = filter.dateFrom
	let dateTo = filter.dateTo

	// Convert date strings to ISO-8601 DateTime format for Prisma
	if (dateFrom && typeof dateFrom === 'string') {
		// If it's just a date (YYYY-MM-DD), convert to start of day in ISO format
		if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
			dateFrom = new Date(dateFrom + 'T00:00:00.000Z').toISOString()
		}
	}
	if (dateTo && typeof dateTo === 'string') {
		// If it's just a date (YYYY-MM-DD), convert to end of day in ISO format
		if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
			dateTo = new Date(dateTo + 'T23:59:59.999Z').toISOString()
		}
	}

	switch (type) {
		case 'equals':
			where[field] = dateFrom
			break
		case 'notEqual':
			where[field] = { not: dateFrom }
			break
		case 'greaterThan':
			where[field] = { gt: dateFrom }
			break
		case 'greaterThanOrEqual':
			where[field] = { gte: dateFrom }
			break
		case 'lessThan':
			where[field] = { lt: dateFrom }
			break
		case 'lessThanOrEqual':
			where[field] = { lte: dateFrom }
			break
		case 'inRange':
			where[field] = { gte: dateFrom, lte: dateTo }
			break
		case 'blank':
		case 'empty':
			where[field] = null
			break
		case 'notBlank':
			where[field] = { not: null }
			break
		default:
			console.warn('Unknown date filter type:', type)
	}
}

/**
 * Handles set filters (multi-select)
 */
function applySetFilter(where: Record<string, any>, field: string, filter: Record<string, unknown>): void {
	const values = filter.values as unknown[]

	// Empty values array means no filter selected - skip this filter entirely
	if (!values || values.length === 0) return

	// Check if this is a boolean filter
	const booleanValues = new Set(['Yes', 'No', 'true', 'false', true, false])
	const isBooleanFilter = values.every((v) => booleanValues.has(v as any))

	if (isBooleanFilter) {
		// Convert to boolean
		const converted = values.map((v) => v === 'Yes' || v === 'true' || v === true)

		// Single value - use direct equality
		if (converted.length === 1) {
			where[field] = converted[0]
		}
		// Both true and false selected - no filter needed (show all)
		// length === 2 means both values, so we return without adding a filter
	} else {
		// Non-boolean set filter - use `in` operator
		where[field] = { in: values }
	}
}

/**
 * Applies a filter to a field (main entry point)
 * Determines filterType first, then dispatches to appropriate handler
 */
function applyFilterToField(
	where: Record<string, any>,
	field: string,
	filterValue: unknown,
	disableCaseInsensitive?: boolean,
): void {
	if (!filterValue || typeof filterValue !== 'object') return

	const filter = filterValue as Record<string, unknown>

	// Determine filterType (text, number, date, set)
	const filterType = filter.filterType as string | undefined

	switch (filterType) {
		case 'text':
			applyTextFilter(where, field, filter, disableCaseInsensitive)
			break
		case 'number':
			applyNumberFilter(where, field, filter)
			break
		case 'date':
			applyDateFilter(where, field, filter)
			break
		case 'set':
			applySetFilter(where, field, filter)
			break
		default:
			console.warn('Unknown filter type:', filterType, 'for field:', field, 'filter:', filter)
	}
}

// ============================================================================
// Computed Field Helpers
// ============================================================================

/**
 * Extracts the actual filter value from AG Grid's filter model.
 * Uses the filterType field to determine which property contains the value.
 */
function extractFilterValue(filterValue: unknown): unknown {
	if (!filterValue || typeof filterValue !== 'object') return filterValue

	const filter = filterValue as Record<string, unknown>
	const filterType = filter.filterType as string | undefined

	switch (filterType) {
		case 'date':
			return filter.dateFrom
		case 'number':
		case 'text':
			return filter.filter
		case 'set':
			return filter.values
		default:
			// Fallback for filters without explicit filterType
			return filter.filter ?? filterValue
	}
}

/**
 * Merges the transformed WHERE conditions into the main WHERE clause
 */
function mergeWhereConditions(where: Record<string, any>, transformed: Record<string, any>): void {
	for (const [key, value] of Object.entries(transformed)) {
		where[key] = value
	}
}

// ============================================================================
// WHERE Clause Builder
// ============================================================================

/**
 * Checks if a value is a date with non-zero time component
 */
function hasTimeComponent(value: unknown): boolean {
	if (!value) return false
	const date = value instanceof Date ? value : new Date(value as string)
	if (isNaN(date.getTime())) return false

	return (
		date.getUTCHours() !== 0 ||
		date.getUTCMinutes() !== 0 ||
		date.getUTCSeconds() !== 0 ||
		date.getUTCMilliseconds() !== 0
	)
}

/**
 * Creates a date range filter for the same day (UTC)
 */
function createDateRangeFilter(dateValue: unknown): { gte: string; lt: string } {
	const date = dateValue instanceof Date ? dateValue : new Date(dateValue as string)

	// Start of day in UTC
	const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))

	// Start of next day in UTC
	const startOfNextDay = new Date(startOfDay)
	startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1)

	return {
		gte: startOfDay.toISOString(),
		lt: startOfNextDay.toISOString(),
	}
}

/**
 * Builds the WHERE clause for an AG Grid request
 */
function buildWhereClause(
	request: AGGridRequest,
	config: AGGridQueryConfig,
	groupKeys: string[],
	rowGroupCols: AGGridColumn[],
): Record<string, any> {
	let where: Record<string, any> = {}

	// Apply group keys (drill-down filters)
	if (groupKeys.length > 0) {
		for (let i = 0; i < groupKeys.length; i++) {
			const col = rowGroupCols[i]
			const key = groupKeys[i]

			const computedField = config.computedFields?.find((cf) => cf.columnId === col.id)
			if (computedField) {
				// Use transform to get WHERE conditions for computed field
				const transformed = computedField.transform(key)
				mergeWhereConditions(where, transformed)
			} else {
				// Check if this is a date with time component
				// If so, use date range instead of exact match
				if (hasTimeComponent(key)) {
					where[col.id] = createDateRangeFilter(key)
				} else {
					where[col.id] = key
				}
			}
		}
	}

	// Apply filters
	if (request.filterModel) {
		for (const [columnId, filterValue] of Object.entries(request.filterModel)) {
			if (!filterValue) continue

			const computedField = config.computedFields?.find((cf) => cf.columnId === columnId)
			if (computedField) {
				// Extract the actual filter value and transform it
				const extractedValue = extractFilterValue(filterValue)
				const transformed = computedField.transform(extractedValue)
				mergeWhereConditions(where, transformed)
			} else {
				applyFilterToField(where, columnId, filterValue, config.disableCaseInsensitive)
			}
		}
	}

	// Apply custom where transformations
	if (config.transformWhere) {
		where = config.transformWhere(where, request)
	}

	// Transform flat dotted keys to nested Prisma format
	// This happens after all filters are applied, in one place
	return transformForPrisma(where)
}

// ============================================================================
// ORDER BY Clause Builder
// ============================================================================

/**
 * Builds the ORDER BY clause for an AG Grid request
 */
function buildOrderByClause(request: AGGridRequest, config: AGGridQueryConfig): Record<string, unknown>[] {
	const orderBy: Record<string, any>[] = []

	if (request.sortModel && request.sortModel.length > 0) {
		for (const sort of request.sortModel) {
			const computedField = config.computedFields?.find((cf) => cf.columnId === sort.colId)
			if (computedField) {
				// Skip computed fields - they cannot be sorted at the database level
				// Sorting must be handled client-side or in-memory after fetching
				continue
			}

			// Add sort with flat key (transformation happens later)
			orderBy.push({ [sort.colId]: sort.sort })
		}
	} else if (config.defaultSort) {
		for (const [field, direction] of Object.entries(config.defaultSort)) {
			// Add sort with flat key (transformation happens later)
			orderBy.push({ [field]: direction })
		}
	}

	// Transform flat dotted keys to nested Prisma format
	// This happens after all sorts are added, in one place
	return transformForPrisma(orderBy)
}

// ============================================================================
// Group Request Handler
// ============================================================================

/**
 * Extracts a group value from a record (handles computed, nested, and direct fields)
 */
function extractGroupValue<TRecord = any>(
	record: TRecord,
	columnId: string,
	computedFields?: ComputedField<TRecord>[],
): unknown {
	const computedField = computedFields?.find((cf) => cf.columnId === columnId)
	if (computedField) {
		return computedField.valueGetter(record)
	}

	// Handle nested or direct field
	return columnId.includes('.') ? getNestedValue(record, columnId) : (record as Record<string, unknown>)[columnId]
}

/**
 * Compares two values for sorting
 */
function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
	const aVal = a ?? ''
	const bVal = b ?? ''

	// Numeric comparison
	if (typeof aVal === 'number' && typeof bVal === 'number') {
		return direction === 'asc' ? aVal - bVal : bVal - aVal
	}

	// String comparison
	const comparison = String(aVal).localeCompare(String(bVal))
	return direction === 'asc' ? comparison : -comparison
}

/**
 * Builds a map of group keys to their counts
 */
function buildGroupMap<TRecord = any>(
	records: TRecord[],
	groupColumnId: string,
	computedFields?: ComputedField<TRecord>[],
): Map<string, number> {
	const groupMap = new Map<string, number>()

	for (const record of records) {
		const groupValue = extractGroupValue(record, groupColumnId, computedFields)
		const groupKey = String(groupValue ?? '').trim()

		if (groupKey) {
			groupMap.set(groupKey, (groupMap.get(groupKey) || 0) + 1)
		}
	}

	return groupMap
}

/**
 * Determines the sort configuration for groups
 */
function getGroupSortConfig(
	sortModel: AGGridSort[],
	rowGroupCols: AGGridColumn[],
	defaultColumnId: string,
): { colId: string; direction: 'asc' | 'desc' } {
	if (sortModel && sortModel.length > 0) {
		// Find a sort matching a group column, or use the first sort
		const sort = sortModel.find((s) => rowGroupCols.some((col) => col.id === s.colId)) || sortModel[0]
		return { colId: sort.colId, direction: sort.sort }
	}

	return { colId: defaultColumnId, direction: 'asc' }
}

/**
 * Converts group map entries to sorted group rows
 */
function createSortedGroupRows(
	groupMap: Map<string, number>,
	groupColumnId: string,
	sortConfig: { colId: string; direction: 'asc' | 'desc' },
): any[] {
	return Array.from(groupMap.entries())
		.map(([key, count]) =>
			transformForPrisma({
				childCount: count,
				[groupColumnId]: key,
			}),
		)
		.sort((a, b) => {
			const aVal = getNestedValue(a, sortConfig.colId) ?? getNestedValue(a, groupColumnId)
			const bVal = getNestedValue(b, sortConfig.colId) ?? getNestedValue(b, groupColumnId)
			return compareValues(aVal, bVal, sortConfig.direction)
		})
}

/**
 * Handles a group-level request (returns group rows with counts)
 */
async function handleGroupRequest(
	queryParams: AGGridQueryParams,
	config: AGGridQueryConfig,
	request: AGGridRequest,
): Promise<AGGridResponse> {
	const { skip: startRow, take: endRow, groupColumn } = queryParams
	const { sortModel, rowGroupCols } = request

	// Fetch all records to compute groups (can be optimized with SQL GROUP BY in the future)
	const allRecords = await config.fetch({ ...queryParams, skip: 0, take: 999999 })

	// Build group map
	const groupMap = buildGroupMap(allRecords, groupColumn!.id, config.computedFields)

	// Determine sort configuration
	const sortConfig = getGroupSortConfig(sortModel, rowGroupCols, groupColumn!.id)

	// Convert to sorted group rows
	const groups = createSortedGroupRows(groupMap, groupColumn!.id, sortConfig)

	// Apply pagination
	const paginatedGroups = groups.slice(startRow, startRow + endRow)

	return {
		rows: paginatedGroups,
		lastRow: groups.length,
	}
}

// ============================================================================
// Leaf Request Handler
// ============================================================================

/**
 * Handles a leaf-level request (returns actual data rows)
 */
async function handleLeafRequest(queryParams: AGGridQueryParams, config: AGGridQueryConfig): Promise<AGGridResponse> {
	const { groupKeys } = queryParams

	// Fetch leaf data
	const [rows, totalCount] = await Promise.all([config.fetch(queryParams), config.count(queryParams)])

	// Apply computed field value getters
	let mappedRows = rows
	if (config.computedFields) {
		mappedRows = rows.map((record) => {
			const mapped = { ...record }
			for (const computedField of config.computedFields!) {
				mapped[computedField.columnId] = computedField.valueGetter(record)
			}
			return mapped
		})
	}

	return {
		rows: mappedRows,
		lastRow: groupKeys.length > 0 ? mappedRows.length : totalCount,
	}
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
 *       columnId: 'weekEnding',
 *       // Display the computed week ending date
 *       valueGetter: (record) => getWeekEndingDate(record.interventionDate),
 *       // Transform to underlying database field conditions
 *       // Handles both filtering and grouping automatically
 *       transform: (date) => {
 *         const weekEnd = new Date(date)
 *         const weekStart = new Date(weekEnd)
 *         weekStart.setUTCDate(weekEnd.getUTCDate() - 6)
 *         return {
 *           interventionDate: { gte: weekStart, lte: weekEnd }
 *         }
 *       }
 *     },
 *     {
 *       columnId: 'fullName',
 *       // Display concatenated name
 *       valueGetter: (record) => `${record.firstName} ${record.lastName}`,
 *       // Filter across multiple fields
 *       transform: (name) => {
 *         const [first, last] = String(name).split(' ')
 *         return {
 *           firstName: { contains: first, mode: 'insensitive' },
 *           lastName: { contains: last, mode: 'insensitive' }
 *         }
 *       }
 *     }
 *   ]
 * })(request)
 * ```
 */
export function createAGGridQuery<TRecord = any>(config: AGGridQueryConfig<TRecord>) {
	return async (request: AGGridRequest): Promise<AGGridResponse<TRecord>> => {
		// Normalize all values in the request upfront
		const normalizedRequest = normalizeRequest(request, config.skipNormalization)

		const { startRow = 0, endRow = 100, rowGroupCols = [], groupKeys = [] } = normalizedRequest

		// Determine if we're handling groups or leaf data
		const isGroupRequest = rowGroupCols.length > 0 && groupKeys.length < rowGroupCols.length
		const groupLevel = groupKeys.length
		const groupColumn = isGroupRequest ? rowGroupCols[groupLevel] : undefined

		// Build WHERE clause
		const where = buildWhereClause(normalizedRequest, config, groupKeys, rowGroupCols)

		// Build ORDER BY clause
		const orderBy = buildOrderByClause(normalizedRequest, config)

		// Build query params
		const queryParams: AGGridQueryParams = {
			where,
			orderBy,
			skip: startRow,
			take: endRow - startRow,
			groupLevel,
			groupKeys,
			groupColumn,
			isGroupRequest,
		}

		// Dispatch to appropriate handler
		if (isGroupRequest) {
			return await handleGroupRequest(queryParams, config, normalizedRequest)
		} else {
			return await handleLeafRequest(queryParams, config)
		}
	}
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
export function createAGGridDatasource<TData = any>(
	fetcher: (request: AGGridRequest) => Promise<AGGridResponse<TData>>,
	options: {
		onError?: (error: unknown) => void
		onBeforeRequest?: (request: AGGridRequest) => void
		onAfterResponse?: (response: AGGridResponse) => void
		debug?: boolean
	} = {},
): IServerSideDatasource<TData> {
	const { onError, onBeforeRequest, onAfterResponse, debug = false } = options

	return {
		getRows: async (params: IServerSideGetRowsParams<TData>) => {
			try {
				// Extract request details from AG Grid
				const request: AGGridRequest = {
					startRow: params.request.startRow,
					endRow: params.request.endRow,
					filterModel: params.request.filterModel as Record<string, unknown>,
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
	pagination: false,
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

	/** Boolean filter (Yes/No) */
	boolean: {
		filter: 'agSetColumnFilter',
		filterParams: {
			values: ['Yes', 'No'],
			buttons: ['clear'],
		},
	},
} as const
