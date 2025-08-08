<script lang="ts">
	import Label from './Label.svelte'

	type Props = {
		value?: any
		name?: string
		label?: string
		class?: string
		required?: boolean
		disabled?: boolean
		element?: HTMLElement
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
		name,
		required,
		disabled,
		class: myClass,
		error,
		zodErrors,
		...rest
	}: Props = $props()
	const errorText = $derived.by(() => {
		if (error) return error
		if (!name) return undefined
		if (zodErrors) return zodErrors.find((e) => e.path.includes(name))?.message
		return undefined
	})
</script>

<Label class={myClass} {label} {name} optional={!required} {disabled} error={errorText}>
	<textarea bind:this={element} {disabled} {name} class="textarea w-full" {...rest} bind:value></textarea>
</Label>
