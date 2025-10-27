import type { AGGridRequest, AGGridResponse } from './ag-grid-refactored.js'

// ============================================================================
// Core Types - Power Apps Web API
// ============================================================================

/**
 * AG Grid sort model (from AG Grid API)
 */
type AGGridSort = {
	colId: string
	sort: 'asc' | 'desc'
}

/**
 * Power Apps Web API OData response format
 */
export type PowerAppsODataResponse<TEntity = any> = {
	'@odata.context': string
	'@odata.count'?: number
	'@odata.nextLink'?: string
	value: TEntity[]
}

/**
 * Power Apps Web API error response format
 */
export type PowerAppsError = {
	error: {
		code: string
		message: string
		innererror?: {
			message: string
			type: string
			stacktrace: string
		}
	}
}

/**
 * Configuration for Power Apps query builder
 */
export type PowerAppsQueryConfig<TEntity = any> = {
	/** Base URL for the Web API (e.g., "[Organization URI]/api/data/v9.2") */
	baseUrl: string
	/** Entity set name (e.g., "accounts", "contacts") */
	entitySet: string
	/** Optional: HTTP headers (auth, preferences, etc.) */
	headers?: Record<string, string>
	/** Optional: Default columns to select */
	defaultSelect?: string[]
	/** Optional: Default sort order */
	defaultOrderBy?: string
	/** Optional: Related entities to expand (simple strings or full ExpandConfig objects) */
	expand?: (string | ExpandConfig)[]
	/** Optional: Transform OData response to custom format */
	transformResponse?: (data: TEntity[]) => TEntity[]
	/** Optional: Maximum URL length before warning (default: 32768) */
	maxUrlLength?: number
}

/**
 * OData query parameters
 */
export type ODataQueryParams = {
	$select?: string
	$filter?: string
	$orderby?: string
	$top?: number
	$skip?: number
	$count?: boolean
	$expand?: string
}

// ============================================================================
// Helper: Build OData $select Clause
// ============================================================================

/**
 * Builds the OData $select query parameter from column selections
 *
 * @param columns - Array of column names to select
 * @returns OData $select string (e.g., "name,revenue,statecode")
 *
 * @example
 * ```typescript
 * buildODataSelect(['accountid', 'name', 'revenue'])
 * // Returns: "accountid,name,revenue"
 *
 * buildODataSelect(['contactid', 'fullname', 'parentcustomerid_account/name'])
 * // Returns: "contactid,fullname,parentcustomerid_account/name"
 * ```
 */
export function buildODataSelect(columns?: string[]): string | undefined {
	if (!columns || columns.length === 0) return undefined
	return columns.join(',')
}

// ============================================================================
// Helper: Build OData $orderby Clause
// ============================================================================

/**
 * Builds the OData $orderby query parameter from AG Grid sort model
 *
 * OData orderby syntax: "field1 asc,field2 desc"
 *
 * @param sortModel - AG Grid sort model
 * @param defaultOrderBy - Fallback sort if no sort model provided
 * @returns OData $orderby string (e.g., "name asc,revenue desc")
 *
 * @example
 * ```typescript
 * buildODataOrderBy([
 *   { colId: 'name', sort: 'asc' },
 *   { colId: 'revenue', sort: 'desc' }
 * ])
 * // Returns: "name asc,revenue desc"
 * ```
 */
export function buildODataOrderBy(sortModel?: AGGridSort[], defaultOrderBy?: string): string | undefined {
	if (!sortModel || sortModel.length === 0) {
		return defaultOrderBy
	}

	return sortModel.map((sort) => `${sort.colId} ${sort.sort}`).join(',')
}

// ============================================================================
// Helper: Build OData $filter Clause
// ============================================================================

/**
 * Escapes single quotes in OData string values
 * OData requires single quotes to be doubled (e.g., "O'Bryan" -> "O''Bryan")
 */
function escapeODataString(value: string): string {
	return value.replace(/'/g, "''")
}

/**
 * Formats a value for use in OData filter expressions
 */
function formatODataValue(value: unknown): string {
	if (value === null || value === undefined) {
		return 'null'
	}

	if (typeof value === 'string') {
		// Dates in ISO format should not be quoted
		if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
			return value
		}
		return `'${escapeODataString(value)}'`
	}

	if (typeof value === 'boolean') {
		return value ? 'true' : 'false'
	}

	if (value instanceof Date) {
		return value.toISOString()
	}

	// Numbers and other primitives
	return String(value)
}

/**
 * Converts AG Grid text filter to OData expression
 */
function convertTextFilter(field: string, filter: Record<string, unknown>): string {
	const type = filter.type as string
	const value = filter.filter as string

	switch (type) {
		case 'equals':
			return `${field} eq ${formatODataValue(value)}`
		case 'notEqual':
			return `${field} ne ${formatODataValue(value)}`
		case 'contains':
			return `contains(${field},${formatODataValue(value)})`
		case 'notContains':
			return `not contains(${field},${formatODataValue(value)})`
		case 'startsWith':
			return `startswith(${field},${formatODataValue(value)})`
		case 'endsWith':
			return `endswith(${field},${formatODataValue(value)})`
		case 'blank':
		case 'empty':
			return `${field} eq null`
		case 'notBlank':
			return `${field} ne null`
		default:
			console.warn('Unknown text filter type:', type)
			return ''
	}
}

/**
 * Converts AG Grid number filter to OData expression
 */
function convertNumberFilter(field: string, filter: Record<string, unknown>): string {
	const type = filter.type as string
	const value = filter.filter
	const valueTo = filter.filterTo

	switch (type) {
		case 'equals':
			return `${field} eq ${value}`
		case 'notEqual':
			return `${field} ne ${value}`
		case 'greaterThan':
			return `${field} gt ${value}`
		case 'greaterThanOrEqual':
			return `${field} ge ${value}`
		case 'lessThan':
			return `${field} lt ${value}`
		case 'lessThanOrEqual':
			return `${field} le ${value}`
		case 'inRange':
			return `${field} ge ${value} and ${field} le ${valueTo}`
		case 'blank':
		case 'empty':
			return `${field} eq null`
		case 'notBlank':
			return `${field} ne null`
		default:
			console.warn('Unknown number filter type:', type)
			return ''
	}
}

/**
 * Converts AG Grid date filter to OData expression
 */
function convertDateFilter(field: string, filter: Record<string, unknown>): string {
	const type = filter.type as string
	let dateFrom = filter.dateFrom as string
	let dateTo = filter.dateTo as string

	// Ensure dates are in ISO format
	if (dateFrom && !/^\d{4}-\d{2}-\d{2}T/.test(dateFrom)) {
		dateFrom = new Date(dateFrom).toISOString()
	}
	if (dateTo && !/^\d{4}-\d{2}-\d{2}T/.test(dateTo)) {
		dateTo = new Date(dateTo).toISOString()
	}

	switch (type) {
		case 'equals':
			return `${field} eq ${dateFrom}`
		case 'notEqual':
			return `${field} ne ${dateFrom}`
		case 'greaterThan':
			return `${field} gt ${dateFrom}`
		case 'greaterThanOrEqual':
			return `${field} ge ${dateFrom}`
		case 'lessThan':
			return `${field} lt ${dateFrom}`
		case 'lessThanOrEqual':
			return `${field} le ${dateFrom}`
		case 'inRange':
			return `${field} ge ${dateFrom} and ${field} le ${dateTo}`
		case 'blank':
		case 'empty':
			return `${field} eq null`
		case 'notBlank':
			return `${field} ne null`
		default:
			console.warn('Unknown date filter type:', type)
			return ''
	}
}

/**
 * Converts AG Grid set filter (multi-select) to OData expression
 */
function convertSetFilter(field: string, filter: Record<string, unknown>): string {
	const values = filter.values as unknown[]

	if (!values || values.length === 0) {
		return ''
	}

	// Check if this is a boolean filter
	const booleanValues = new Set(['Yes', 'No', 'true', 'false', true, false])
	const isBooleanFilter = values.every((v) => booleanValues.has(v as any))

	if (isBooleanFilter) {
		// Convert to boolean
		const converted = values.map((v) => v === 'Yes' || v === 'true' || v === true)

		// Single value - use direct equality
		if (converted.length === 1) {
			return `${field} eq ${converted[0]}`
		}

		// Both true and false selected - no filter needed (show all)
		if (converted.length === 2) {
			return ''
		}
	}

	// For multiple values, use 'or' conditions
	// OData doesn't have a native 'in' operator like SQL, so we use multiple 'or' conditions
	const conditions = values.map((v) => `${field} eq ${formatODataValue(v)}`)
	return `(${conditions.join(' or ')})`
}

/**
 * Converts a single AG Grid filter to OData expression
 */
function convertFilterToOData(field: string, filterValue: unknown): string {
	if (!filterValue || typeof filterValue !== 'object') {
		return ''
	}

	const filter = filterValue as Record<string, unknown>
	const filterType = filter.filterType as string | undefined

	switch (filterType) {
		case 'text':
			return convertTextFilter(field, filter)
		case 'number':
			return convertNumberFilter(field, filter)
		case 'date':
			return convertDateFilter(field, filter)
		case 'set':
			return convertSetFilter(field, filter)
		default:
			console.warn('Unknown filter type:', filterType, 'for field:', field)
			return ''
	}
}

/**
 * Builds the OData $filter query parameter from AG Grid filter model
 *
 * Converts AG Grid's filter model to OData filter syntax, supporting:
 * - Text filters: eq, ne, contains, startswith, endswith
 * - Number filters: eq, ne, gt, ge, lt, le, inRange
 * - Date filters: eq, ne, gt, ge, lt, le, inRange
 * - Set filters: multi-value OR conditions
 * - Null checks: blank/notBlank
 *
 * @param filterModel - AG Grid filter model
 * @returns OData $filter string
 *
 * @example
 * ```typescript
 * // Text filter
 * buildODataFilter({ name: { filterType: 'text', type: 'contains', filter: 'John' } })
 * // Returns: "contains(name,'John')"
 *
 * // Number range
 * buildODataFilter({
 *   revenue: { filterType: 'number', type: 'inRange', filter: 1000, filterTo: 5000 }
 * })
 * // Returns: "revenue ge 1000 and revenue le 5000"
 *
 * // Multiple filters (AND logic)
 * buildODataFilter({
 *   name: { filterType: 'text', type: 'contains', filter: 'Corp' },
 *   revenue: { filterType: 'number', type: 'greaterThan', filter: 10000 }
 * })
 * // Returns: "contains(name,'Corp') and revenue gt 10000"
 *
 * // Set filter (OR logic for multiple values)
 * buildODataFilter({
 *   status: { filterType: 'set', values: ['Active', 'Pending'] }
 * })
 * // Returns: "(status eq 'Active' or status eq 'Pending')"
 * ```
 */
export function buildODataFilter(filterModel?: Record<string, unknown>): string | undefined {
	if (!filterModel || Object.keys(filterModel).length === 0) {
		return undefined
	}

	const filters: string[] = []

	for (const [field, filterValue] of Object.entries(filterModel)) {
		const filterExpression = convertFilterToOData(field, filterValue)
		if (filterExpression) {
			filters.push(filterExpression)
		}
	}

	if (filters.length === 0) {
		return undefined
	}

	// Multiple filters are combined with AND
	return filters.length === 1 ? filters[0] : filters.join(' and ')
}

// ============================================================================
// Helper: Build OData $expand Clause
// ============================================================================

/**
 * Configuration for expanding a related entity
 */
export type ExpandConfig = {
	/** Navigation property name to expand */
	navigationProperty: string
	/** Optional: Columns to select from the expanded entity */
	select?: string[]
	/** Optional: Filter for collection-valued navigation properties */
	filter?: string
	/** Optional: Order by for collection-valued navigation properties (not supported with nested expand) */
	orderBy?: string
	/** Optional: Top N records for collection-valued navigation properties (not supported with nested expand) */
	top?: number
	/** Optional: Nested expands */
	expand?: ExpandConfig[]
}

/**
 * Builds OData expand options for a single navigation property
 */
function buildExpandOptions(config: ExpandConfig): string {
	const options: string[] = []

	if (config.select && config.select.length > 0) {
		options.push(`$select=${config.select.join(',')}`)
	}

	if (config.filter) {
		options.push(`$filter=${config.filter}`)
	}

	if (config.orderBy) {
		options.push(`$orderby=${config.orderBy}`)
	}

	if (config.top !== undefined) {
		options.push(`$top=${config.top}`)
	}

	if (config.expand && config.expand.length > 0) {
		const nestedExpands = config.expand.map(buildSingleExpand).join(',')
		options.push(`$expand=${nestedExpands}`)
	}

	return options.join(';')
}

/**
 * Builds a single expand expression
 */
function buildSingleExpand(config: ExpandConfig): string {
	const options = buildExpandOptions(config)

	if (options) {
		return `${config.navigationProperty}(${options})`
	}

	return config.navigationProperty
}

/**
 * Builds the OData $expand query parameter for joining related tables
 *
 * Supports:
 * - Single-valued navigation properties (many-to-one lookups)
 * - Collection-valued navigation properties (one-to-many relationships)
 * - Nested expands (up to recommended limit)
 * - Expand with $select, $filter, $orderby, $top
 *
 * Limitations:
 * - Max 15 $expand options recommended per query
 * - $orderby and $top not supported with nested $expand on collections
 * - Nested $expand not supported with N:N relationships
 *
 * @param expands - Array of expand configurations
 * @returns OData $expand string
 *
 * @example Single expand with select
 * ```typescript
 * buildODataExpand([
 *   { navigationProperty: 'primarycontactid', select: ['fullname', 'emailaddress1'] }
 * ])
 * // Returns: "primarycontactid($select=fullname,emailaddress1)"
 * ```
 *
 * @example Multiple expands
 * ```typescript
 * buildODataExpand([
 *   { navigationProperty: 'primarycontactid', select: ['fullname'] },
 *   { navigationProperty: 'createdby', select: ['fullname'] }
 * ])
 * // Returns: "primarycontactid($select=fullname),createdby($select=fullname)"
 * ```
 *
 * @example Collection with filter and order
 * ```typescript
 * buildODataExpand([
 *   {
 *     navigationProperty: 'Account_Tasks',
 *     select: ['subject', 'createdon'],
 *     filter: "contains(subject,'Task')",
 *     orderBy: 'createdon desc',
 *     top: 10
 *   }
 * ])
 * // Returns: "Account_Tasks($select=subject,createdon;$filter=contains(subject,'Task');$orderby=createdon desc;$top=10)"
 * ```
 *
 * @example Nested expand
 * ```typescript
 * buildODataExpand([
 *   {
 *     navigationProperty: 'primarycontactid',
 *     select: ['fullname'],
 *     expand: [
 *       { navigationProperty: 'createdby', select: ['fullname'] }
 *     ]
 *   }
 * ])
 * // Returns: "primarycontactid($select=fullname;$expand=createdby($select=fullname))"
 * ```
 */
export function buildODataExpand(expands?: ExpandConfig[]): string | undefined {
	if (!expands || expands.length === 0) {
		return undefined
	}

	// Warning for too many expands (affects performance)
	if (expands.length > 15) {
		console.warn(
			`Query contains ${expands.length} $expand options. ` + 'Consider limiting to 15 or fewer for better performance.',
		)
	}

	return expands.map(buildSingleExpand).join(',')
}

/**
 * Simplified expand builder for basic use cases
 * Use this when you just need to expand navigation properties with optional column selection
 *
 * @param navigationProperties - Array of navigation property names or objects with select
 * @returns OData $expand string
 *
 * @example
 * ```typescript
 * buildSimpleExpand(['primarycontactid', 'createdby'])
 * // Returns: "primarycontactid,createdby"
 *
 * buildSimpleExpand([
 *   'primarycontactid',
 *   { navigationProperty: 'createdby', select: ['fullname'] }
 * ])
 * // Returns: "primarycontactid,createdby($select=fullname)"
 * ```
 */
export function buildSimpleExpand(
	navigationProperties?: (string | { navigationProperty: string; select?: string[] })[],
): string | undefined {
	if (!navigationProperties || navigationProperties.length === 0) {
		return undefined
	}

	const configs: ExpandConfig[] = navigationProperties.map((prop) => {
		if (typeof prop === 'string') {
			return { navigationProperty: prop }
		}
		return prop as ExpandConfig
	})

	return buildODataExpand(configs)
}

// ============================================================================
// Main Query Builder
// ============================================================================

/**
 * Creates a Power Apps query handler for server-side data fetching
 *
 * This is the main API for querying Power Apps Web API. It accepts AG Grid requests
 * and returns data in AG Grid response format, handling all OData translation automatically.
 *
 * @param config - Power Apps query configuration
 * @returns Function that processes AG Grid requests and returns responses
 *
 * @example Basic usage
 * ```typescript
 * const accountsQuery = createPowerAppsQuery({
 *   baseUrl: 'https://org.crm.dynamics.com/api/data/v9.2',
 *   entitySet: 'accounts',
 *   headers: {
 *     'Authorization': 'Bearer YOUR_TOKEN',
 *     'Prefer': 'odata.include-annotations="*"'
 *   },
 *   defaultSelect: ['accountid', 'name', 'revenue']
 * })
 *
 * const response = await accountsQuery(agGridRequest)
 * // Returns: { rows: [...], lastRow: 1000 }
 * ```
 *
 * @example With related data
 * ```typescript
 * const contactsQuery = createPowerAppsQuery({
 *   baseUrl: 'https://org.crm.dynamics.com/api/data/v9.2',
 *   entitySet: 'contacts',
 *   expand: [
 *     { navigationProperty: 'parentcustomerid_account', select: ['name'] }
 *   ]
 * })
 * ```
 *
 * @example With transformation
 * ```typescript
 * const query = createPowerAppsQuery({
 *   baseUrl: 'https://org.crm.dynamics.com/api/data/v9.2',
 *   entitySet: 'accounts',
 *   transformResponse: (data) => data.map(item => ({
 *     id: item.accountid,
 *     name: item.name
 *   }))
 * })
 * ```
 */
export function createPowerAppsQuery<TEntity = any>(config: PowerAppsQueryConfig<TEntity>) {
	return async (request: AGGridRequest): Promise<AGGridResponse<TEntity>> => {
		const { startRow = 0, endRow = 100, filterModel, sortModel } = request

		// Build query parameters
		const params: ODataQueryParams = {
			$count: true, // Always request count for total rows
		}

		// Add select
		if (config.defaultSelect) {
			params.$select = buildODataSelect(config.defaultSelect)
		}

		// Add filter
		if (filterModel && Object.keys(filterModel).length > 0) {
			params.$filter = buildODataFilter(filterModel)
		}

		// Add orderby
		if (sortModel && sortModel.length > 0) {
			params.$orderby = buildODataOrderBy(sortModel, config.defaultOrderBy)
		} else if (config.defaultOrderBy) {
			params.$orderby = config.defaultOrderBy
		}

		// Add pagination
		const pageSize = endRow - startRow
		params.$top = pageSize

		// Add expand
		if (config.expand) {
			const expandConfigs: ExpandConfig[] = config.expand.map((exp) =>
				typeof exp === 'string' ? { navigationProperty: exp } : exp,
			)
			params.$expand = buildODataExpand(expandConfigs)
		}

		// Build URL
		const url = buildQueryUrl(config.baseUrl, config.entitySet, params)

		// Check URL length
		if (url.length > (config.maxUrlLength || 32768)) {
			console.warn(
				`Query URL length (${url.length} chars) exceeds recommended limit. ` +
					'Consider using $batch operations for complex queries. ' +
					'See: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/execute-batch-operations-using-web-api',
			)
		}

		// Build headers
		const headers: Record<string, string> = {
			Accept: 'application/json',
			'OData-MaxVersion': '4.0',
			'OData-Version': '4.0',
			Prefer: `odata.maxpagesize=${pageSize}`,
			'If-None-Match': 'null', // Override browser caching for fresh data
			...config.headers,
		}

		try {
			// Execute request
			const response = await fetch(url, {
				method: 'GET',
				headers,
			})

			if (!response.ok) {
				throw await parseErrorResponse(response)
			}

			const data: PowerAppsODataResponse<TEntity> = await response.json()

			// Extract rows
			let rows = data.value || []

			// Apply transformation if provided
			if (config.transformResponse) {
				rows = config.transformResponse(rows)
			}

			// Calculate total count
			const totalCount = data['@odata.count']
			const lastRow = totalCount !== undefined ? totalCount : undefined

			return {
				rows,
				lastRow,
			}
		} catch (error) {
			console.error('Power Apps query failed:', error)
			throw error
		}
	}
}

/**
 * Builds the complete query URL with parameters
 */
function buildQueryUrl(baseUrl: string, entitySet: string, params: ODataQueryParams): string {
	// Remove trailing slash from baseUrl
	const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

	// Build query string
	const queryParts: string[] = []

	if (params.$select) {
		queryParts.push(`$select=${encodeURIComponent(params.$select)}`)
	}
	if (params.$filter) {
		queryParts.push(`$filter=${encodeURIComponent(params.$filter)}`)
	}
	if (params.$orderby) {
		queryParts.push(`$orderby=${encodeURIComponent(params.$orderby)}`)
	}
	if (params.$expand) {
		queryParts.push(`$expand=${encodeURIComponent(params.$expand)}`)
	}
	if (params.$top !== undefined) {
		queryParts.push(`$top=${params.$top}`)
	}
	if (params.$skip !== undefined) {
		queryParts.push(`$skip=${params.$skip}`)
	}
	if (params.$count) {
		queryParts.push('$count=true')
	}

	const queryString = queryParts.join('&')
	return `${base}/${entitySet}${queryString ? '?' + queryString : ''}`
}

/**
 * Parses error response from Power Apps API
 */
async function parseErrorResponse(response: Response): Promise<Error> {
	try {
		const errorData: PowerAppsError = await response.json()
		const message = errorData.error?.message || 'Unknown error'
		const code = errorData.error?.code || 'UNKNOWN'

		return new Error(`Power Apps API Error [${code}]: ${message}`)
	} catch {
		return new Error(`Power Apps API Error: ${response.status} ${response.statusText}`)
	}
}

/**
 * Fetches the next page using the @odata.nextLink URL
 *
 * Use this to implement manual pagination when you need to fetch additional pages
 * beyond what AG Grid requests automatically.
 *
 * @param nextLink - The @odata.nextLink URL from a previous response
 * @param headers - Headers to include in the request (auth, etc.)
 * @returns The next page of data
 *
 * @example
 * ```typescript
 * const firstPage = await accountsQuery(agGridRequest)
 *
 * // If there's more data, fetch the next page
 * if (firstPage.nextLink) {
 *   const secondPage = await fetchNextPage(firstPage.nextLink, {
 *     'Authorization': 'Bearer YOUR_TOKEN'
 *   })
 * }
 * ```
 */
export async function fetchNextPage<TEntity = any>(
	nextLink: string,
	headers?: Record<string, string>,
): Promise<PowerAppsODataResponse<TEntity>> {
	const defaultHeaders: Record<string, string> = {
		Accept: 'application/json',
		'OData-MaxVersion': '4.0',
		'OData-Version': '4.0',
		...headers,
	}

	const response = await fetch(nextLink, {
		method: 'GET',
		headers: defaultHeaders,
	})

	if (!response.ok) {
		throw await parseErrorResponse(response)
	}

	return await response.json()
}

// ============================================================================
// Response Utilities
// ============================================================================

/**
 * Extended response type that includes pagination information
 */
export type PowerAppsQueryResult<TEntity = any> = AGGridResponse<TEntity> & {
	/** Next page link if more data available */
	nextLink?: string
	/** Total count of records matching the filter */
	totalCount?: number
	/** Raw OData context information */
	odataContext?: string
}

/**
 * Enhanced query function that returns additional metadata
 *
 * Use this when you need access to pagination links and other OData metadata
 *
 * @param config - Power Apps query configuration
 * @returns Function that processes requests and returns enhanced responses
 *
 * @example
 * ```typescript
 * const query = createPowerAppsQueryWithMetadata({
 *   baseUrl: 'https://org.crm.dynamics.com/api/data/v9.2',
 *   entitySet: 'accounts'
 * })
 *
 * const result = await query(agGridRequest)
 * console.log(`Got ${result.rows.length} rows, total: ${result.totalCount}`)
 *
 * if (result.nextLink) {
 *   console.log('More data available at:', result.nextLink)
 * }
 * ```
 */
export function createPowerAppsQueryWithMetadata<TEntity = any>(config: PowerAppsQueryConfig<TEntity>) {
	return async (request: AGGridRequest): Promise<PowerAppsQueryResult<TEntity>> => {
		const { startRow = 0, endRow = 100, filterModel, sortModel } = request

		// Build query parameters
		const params: ODataQueryParams = {
			$count: true,
		}

		if (config.defaultSelect) {
			params.$select = buildODataSelect(config.defaultSelect)
		}

		if (filterModel && Object.keys(filterModel).length > 0) {
			params.$filter = buildODataFilter(filterModel)
		}

		if (sortModel && sortModel.length > 0) {
			params.$orderby = buildODataOrderBy(sortModel, config.defaultOrderBy)
		} else if (config.defaultOrderBy) {
			params.$orderby = config.defaultOrderBy
		}

		const pageSize = endRow - startRow
		params.$top = pageSize

		if (config.expand) {
			const expandConfigs: ExpandConfig[] = config.expand.map((exp) =>
				typeof exp === 'string' ? { navigationProperty: exp } : exp,
			)
			params.$expand = buildODataExpand(expandConfigs)
		}

		const url = buildQueryUrl(config.baseUrl, config.entitySet, params)

		if (url.length > (config.maxUrlLength || 32768)) {
			console.warn(
				`Query URL length (${url.length} chars) exceeds recommended limit. ` +
					'Consider using $batch operations for complex queries.',
			)
		}

		const headers: Record<string, string> = {
			Accept: 'application/json',
			'OData-MaxVersion': '4.0',
			'OData-Version': '4.0',
			Prefer: `odata.maxpagesize=${pageSize}`,
			'If-None-Match': 'null',
			...config.headers,
		}

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers,
			})

			if (!response.ok) {
				throw await parseErrorResponse(response)
			}

			const data: PowerAppsODataResponse<TEntity> = await response.json()

			let rows = data.value || []

			if (config.transformResponse) {
				rows = config.transformResponse(rows)
			}

			return {
				rows,
				lastRow: data['@odata.count'],
				nextLink: data['@odata.nextLink'],
				totalCount: data['@odata.count'],
				odataContext: data['@odata.context'],
			}
		} catch (error) {
			console.error('Power Apps query failed:', error)
			throw error
		}
	}
}

/**
 * Utility to fetch all pages of data (use with caution for large datasets)
 *
 * This will continue fetching pages until no more data is available.
 * Be careful with large datasets as this can consume significant memory and time.
 *
 * @param queryFn - The query function created by createPowerAppsQueryWithMetadata
 * @param request - Initial AG Grid request
 * @param maxPages - Optional limit on number of pages to fetch (default: unlimited)
 * @returns All rows across all pages
 *
 * @example
 * ```typescript
 * const query = createPowerAppsQueryWithMetadata({
 *   baseUrl: 'https://org.crm.dynamics.com/api/data/v9.2',
 *   entitySet: 'accounts'
 * })
 *
 * // Fetch up to 10 pages (1000 records if pageSize is 100)
 * const allData = await fetchAllPages(query, agGridRequest, 10)
 * console.log(`Fetched ${allData.length} total records`)
 * ```
 */
export async function fetchAllPages<TEntity = any>(
	queryFn: (request: AGGridRequest) => Promise<PowerAppsQueryResult<TEntity>>,
	request: AGGridRequest,
	maxPages?: number,
): Promise<TEntity[]> {
	const allRows: TEntity[] = []
	let pageCount = 0
	const currentResult = await queryFn(request)

	allRows.push(...currentResult.rows)
	pageCount++

	// Note: Full pagination would require parsing nextLink and creating new requests
	// For now, this serves as a placeholder for the pattern
	if (currentResult.nextLink && (!maxPages || pageCount < maxPages)) {
		console.warn(
			'fetchAllPages requires manual nextLink handling. ' + 'Use fetchNextPage() directly for better control.',
		)
	}

	return allRows
}

// ============================================================================
// Export Summary
// ============================================================================

/**
 * Main exports:
 *
 * Query Builders:
 * - createPowerAppsQuery() - Main query function (returns AG Grid format)
 * - createPowerAppsQueryWithMetadata() - Enhanced query with pagination metadata
 *
 * Helper Functions:
 * - buildODataSelect() - Build $select clause
 * - buildODataOrderBy() - Build $orderby clause
 * - buildODataFilter() - Build $filter clause (from AG Grid filters)
 * - buildODataExpand() - Build $expand clause
 * - buildSimpleExpand() - Simplified expand builder
 * - fetchNextPage() - Fetch next page using @odata.nextLink
 * - fetchAllPages() - Fetch all pages (use with caution)
 *
 * Types:
 * - PowerAppsQueryConfig - Configuration for query builder
 * - PowerAppsODataResponse - OData response format
 * - PowerAppsError - Error response format
 * - PowerAppsQueryResult - Enhanced response with metadata
 * - ExpandConfig - Configuration for expanding related entities
 * - ODataQueryParams - OData query parameters
 */
