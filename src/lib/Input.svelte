<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity'
	import Label from './Label.svelte'
	type Props = {
		value?: any
		name?: string
		label?: string
		class?: string
		required?: boolean
		disabled?: boolean
		element?: HTMLElement
		type?:
			| 'text'
			| 'number'
			| 'password'
			| 'email'
			| 'number'
			| 'tel'
			| 'url'
			| 'date'
			| 'datetime-local'
			| 'color'
			| 'file'
			| 'checkbox'
		error?: string
		zodErrors?: {
			expected: string
			code: string
			path: string[]
			message: string
		}[]
		[x: string]: any
	}
	let {
		value = $bindable(),
		element = $bindable(),
		label,
		type = 'text',
		name,
		required,
		disabled,
		class: myClass,
		error,
		zodErrors,
		...rest
	}: Props = $props()
	function getValue() {
		if (type == 'date') {
			if (!value) return ''
			const dateString = new Date(value).toISOString().split('T')[0]
			return dateString
		} else if (type == 'datetime-local') {
			if (!value) return ''
			const date = new Date(value)
			const dateString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, -1)
			return dateString
		}
		return value ?? ''
	}
	function setValue(newValue: any) {
		if (type == 'number') {
			if (isNaN(Number(newValue))) {
				value = null
			} else {
				value = Number(newValue)
			}
		} else if (type == 'date') {
			const date = new SvelteDate(newValue)
			if (isNaN(date.getTime())) {
				value = null
			} else {
				date.setUTCHours(0, 0, 0, 0)
				value = date
			}
		} else if (type == 'datetime-local') {
			const date = new SvelteDate(newValue)
			if (isNaN(date.getTime())) {
				value = null
			} else {
				date.setSeconds(0, 0)
				value = date
			}
		} else {
			value = newValue
		}
	}

	// File input handlers - FileList is readonly
	function getFiles() {
		return value
	}
	function setFiles(fileList: FileList | null) {
		// FileList is readonly, so we just set it directly
		value = fileList
	}

	let inputClass = $derived.by(() => {
		if (type == 'file') return 'file-input w-full'
		if (type == 'checkbox') return 'checkbox  checkbox-lg'
		return 'input w-full'
	})

	let showOptional = $derived.by(() => {
		return !required && !disabled && type != 'checkbox'
	})

	const errorText = $derived.by(() => {
		if (error) return error
		if (!name) return undefined
		if (zodErrors) return zodErrors.find((e) => e.path.includes(name))?.message
		return undefined
	})
</script>

{#if type != 'file'}
	<input type="hidden" {name} value={value ?? ''} />
{/if}

<Label class={myClass} {label} {name} optional={showOptional} {disabled} error={errorText}>
	{#if type == 'checkbox'}
		<input bind:this={element} type="checkbox" {disabled} class={inputClass} {...rest} bind:checked={value} />
	{:else if type == 'file'}
		<input
			bind:this={element}
			{name}
			type="file"
			{disabled}
			class={inputClass}
			{...rest}
			bind:files={getFiles, setFiles} />
	{:else}
		<input
			bind:this={element}
			{type}
			{disabled}
			{required}
			class="disabled:text-base-content disabled:!border-base-content/20 {inputClass} "
			{...rest}
			bind:value={getValue, setValue} />
	{/if}
</Label>
