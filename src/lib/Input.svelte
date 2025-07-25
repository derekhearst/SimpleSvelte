<script lang="ts">
	import Label from './Label.svelte'
	import dayjs from 'dayjs'
	import utc from 'dayjs/plugin/utc.js'
	dayjs.extend(utc)

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
		...rest
	}: Props = $props()
	function getValue() {
		if (type == 'date') {
			if (!value) return ''
			return dayjs(value).utc().format('YYYY-MM-DD')
		} else if (type == 'datetime-local') {
			if (!value) return ''
			return dayjs(value).format('YYYY-MM-DDTHH:mm')
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
			if (isNaN(Date.parse(newValue))) {
				value = null
			} else {
				const tempDate = dayjs(newValue).utc().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)
				value = tempDate.toDate()
			}
		} else if (type == 'datetime-local') {
			if (isNaN(Date.parse(newValue))) {
				value = null
			} else {
				const tempDate = dayjs(newValue).set('second', 0).set('millisecond', 0)
				value = tempDate.toDate()
			}
		} else {
			value = newValue
		}
	}

	let inputClass = $derived.by(() => {
		if (type == 'file') return 'file-input w-full'
		if (type == 'checkbox') return 'checkbox '
		return 'input w-full'
	})

	let showOptional = $derived.by(() => {
		return !required && !disabled && type != 'checkbox'
	})
</script>

{#if type != 'file'}
	<input type="hidden" {name} value={value ?? ''} />
{/if}

<Label class={myClass} {label} {name} optional={showOptional} {disabled}>
	{#if type == 'checkbox'}
		<input bind:this={element} type="checkbox" {disabled} class={inputClass} {...rest} bind:checked={value} />
	{:else if type == 'file'}
		<input bind:this={element} {name} type="file" {disabled} class={inputClass} {...rest} />
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
