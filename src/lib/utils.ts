export class FormHelper {
	formData: FormData
	constructor(form: FormData) {
		this.formData = form
	}

	string(key: string) {
		return this.formData.get(key) as string
	}
	nString(key: string) {
		const value = this.formData.get(key) as string
		if (value == '' || value == null || value == undefined) return null
		return this.formData.get(key) as string
	}
	uString(key: string) {
		const value = this.formData.get(key) as string
		if (value == '' || value == null || value == undefined) return undefined
		return this.formData.get(key) as string
	}
	int(key: string) {
		return parseInt(this.formData.get(key) as string)
	}
	nInt(key: string) {
		const value = this.formData.get(key) as string
		if (value == '' || value == null || value == undefined) return null
		return parseInt(this.formData.get(key) as string)
	}
	uInt(key: string) {
		const value = this.formData.get(key) as string
		if (value == '' || value == null || value == undefined) return undefined
		return parseInt(this.formData.get(key) as string)
	}
	date(key: string) {
		return new Date(this.formData.get(key) as string)
	}
	nDate(key: string) {
		const value = this.formData.get(key) as string
		if (value == '' || value == null || value == undefined) return null
		return new Date(this.formData.get(key) as string)
	}
	uDate(key: string) {
		const value = this.formData.get(key) as string
		if (value == '' || value == null || value == undefined) return undefined
		return new Date(this.formData.get(key) as string)
	}
	bool(key: string) {
		const value = this.formData.get(key) as string
		if (value == 'on') return true
		return this.formData.get(key) == 'true'
	}
	uBool(key: string) {
		const value = this.formData.get(key) as string
		if (value == '' || value == null || value == undefined) return undefined
		if (value == 'on') return true
		return this.formData.get(key) == 'true'
	}
	nBool(key: string) {
		const value = this.formData.get(key) as string
		if (value == '' || value == null || value == undefined) return null
		if (value == 'on') return true
		return this.formData.get(key) == 'true'
	}
	float(key: string) {
		return parseFloat(this.formData.get(key) as string)
	}

	nFloat(key: string) {
		const value = this.formData.get(key) as string
		if (value == '' || value == undefined) return null
		return parseFloat(this.formData.get(key) as string)
	}
	uFloat(key: string) {
		const value = this.formData.get(key) as string
		if (value == '' || value == undefined) return undefined
		return parseFloat(this.formData.get(key) as string)
	}
	sArray(key: string) {
		const values = this.formData.getAll(key) as string[]
		return values
	}
	nArray(key: string) {
		const value = this.formData.getAll(key) as string[]
		return value.map((v) => parseInt(v))
	}
}

export class RoleHelper {
	roles: string[]
	adminRole: string
	constructor(roles: string[], adminRole: string) {
		this.roles = roles
		this.adminRole = adminRole
	}
	check(allowedRoles: string[]) {
		if (this.roles.includes(this.adminRole)) return true
		return this.roles.some((role) => allowedRoles.includes(role))
	}
}

export function clickOutside(element: HTMLElement, callbackFunction: () => void) {
	function onClick(event: MouseEvent) {
		if (!element.contains(event.target as Node)) {
			callbackFunction()
		}
	}

	document.body.addEventListener('click', onClick)

	return {
		update(newCallbackFunction: () => void) {
			callbackFunction = newCallbackFunction
		},
		destroy() {
			document.body.removeEventListener('click', onClick)
		},
	}
}
