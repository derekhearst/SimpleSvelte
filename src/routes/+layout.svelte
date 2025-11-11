<script lang="ts">
	import '../app.css'

	let { children } = $props()
</script>

<label class="swap swap-rotate">
	<!-- this hidden checkbox controls the state -->
	<input type="checkbox" class="theme-controller" value="light" />
	<i class="mdi mdi-white-balance-sunny swap-on text-3xl">light</i>
	<i class="mdi mdi-moon-waxing-crescent swap-off text-3xl">dark</i>
</label>

{@render children()}
