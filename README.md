# SimpleSvelte

A lightweight collection of essential Svelte components and utilities for building modern web applications quickly and efficiently.

## Features

- **Form Components**: Ready-to-use Input, Label, Select, and TextArea components with built-in validation support
- **UI Components**: Modal and Grid components for common layout needs
- **Popup System**: Easy-to-use Pop class for alerts, confirmations, and notifications (powered by SweetAlert2)
- **Utility Functions**: FormHelper for form data processing, clickOutside action, and role helpers
- **TypeScript Support**: Fully typed components and utilities
- **Lightweight**: Minimal dependencies, maximum functionality

## Installation

```bash
bun install simplesvelte
```

## CSS Setup

SimpleSvelte requires CSS to be imported for proper styling. See [CSS_USAGE.md](./CSS_USAGE.md) for detailed instructions.

**Quick setup:**
```css
/* In your main CSS file */
@import 'simplesvelte/styles.css';
```

Or in JavaScript/TypeScript:
```typescript
import 'simplesvelte/styles.css';
```

## Quick Start

```svelte
<script>
	import { Input, Label, Modal, Pop } from 'simplesvelte'

	let showModal = false
	let inputValue = ''

	const handleConfirm = async () => {
		const result = await Pop.confirm('Delete item?', 'This action cannot be undone')
		if (result.isConfirmed) {
			// Handle deletion
			Pop.success('Deleted!', 'Your item has been deleted.')
		}
	}
</script>

<Label for="email">Email Address</Label>
<Input name="email" type="email" bind:value={inputValue} placeholder="Enter your email" required />

<button on:click={() => (showModal = true)}>Open Modal</button>
<button on:click={handleConfirm}>Delete Item</button>

<Modal bind:show={showModal}>
	<h2>Modal Content</h2>
	<p>Your modal content goes here!</p>
</Modal>
```

## Components

### Form Components

- **Input**: Versatile input component supporting text, email, password, number, date, and more
- **Label**: Accessible label component with built-in styling
- **Select**: Dropdown select component with custom styling and multi-select support
- **TextArea**: Multi-line text input with auto-resize options

### UI Components

- **Modal**: Flexible modal component with backdrop and keyboard controls
- **Grid**: Responsive grid layout component

### Utilities

- **Pop**: SweetAlert2-powered popup system for alerts, confirmations, and toasts
- **FormHelper**: Utility class for processing FormData with type-safe getters
- **clickOutside**: Svelte action for detecting clicks outside an element
- **roleHelper**: Accessibility helper for ARIA roles

## Examples

### Select Component

```svelte
<script>
	import { Select } from 'simplesvelte'

	let singleValue = ''
	let multipleValues = []

	const options = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' },
	]
</script>

<!-- Single Select -->
<Select bind:value={singleValue} {options} label="Choose a fruit" name="fruit" required />

<!-- Multi Select -->
<Select bind:value={multipleValues} {options} label="Choose multiple fruits" name="fruits" multiple />

<!-- Disabled Select -->
<Select value={['apple', 'cherry']} {options} label="Pre-selected fruits" name="preset-fruits" multiple disabled />
```

### Using Pop for Notifications

```javascript
import { Pop } from 'simplesvelte'

// Success notification
await Pop.success('Your changes have been saved.')

// Error notification
await Pop.error('Something went wrong.')

// Confirmation dialog
const result = await Pop.confirm('Delete this item?', 'This action cannot be undone')
if (!res) {
	// User confirmed
}

// Custom toast
Pop.toast('Updated!', 'success', 'top-end')
```

### Using FormHelper

```svelte
<script>
	import { FormHelper } from 'simplesvelte'

	function parseFormData(FormData: FormData) {
	  const fh = new FormHelper(formData)
	  const data = {
			name: fh.string("name")
			optionalPhone: fh.nString("phone")
		}

		
	}
</script>

<form use:enhance>
	<!-- Your form inputs here -->
</form>
```

### Using clickOutside Action

```svelte
<script>
	import { clickOutside } from 'simplesvelte'

	let showDropdown = false

	function handleClickOutside() {
		showDropdown = false
	}
</script>

<div use:clickOutside={handleClickOutside}>
	<!-- Dropdown content -->
</div>
```

## Development

This library is built with SvelteKit and powered by Vite. To contribute or modify the library:

```bash
# Clone and install dependencies
git clone <your-repo>
cd SimpleSvelte
bun install

# Start development server with showcase app
bun run dev

# or open in browser automatically
bun run dev -- --open
```

The `src/lib` directory contains all library components, while `src/routes` provides a showcase/preview app for testing components.

## Building

To build your library:

```bash
bun run package
```

This will generate the distribution files in the `dist` directory.

## License

MIT - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
