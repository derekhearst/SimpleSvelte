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
		...rest
	}: Props = $props()
</script>

<Label class={myClass} {label} {name} optional={!required} {disabled}>
	<textarea bind:this={element} {disabled} {name} class="textarea w-full" {...rest} bind:value></textarea>
</Label>
