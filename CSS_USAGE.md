## CSS Usage

SimpleSvelte includes pre-built Tailwind CSS and DaisyUI styles that you can import into your project.

### Option 1: Import the CSS in your app

```css
/* In your main CSS file (e.g., app.css) */
@import 'simplesvelte/styles.css';
```

### Option 2: Import via JavaScript/TypeScript

```typescript
// In your main app file (e.g., main.ts, app.ts)
import 'simplesvelte/styles.css'
```

### Option 3: Import the index CSS

```css
/* Alternative import */
@import 'simplesvelte/index.css';
```

### What's Included

The CSS includes:

- **Tailwind CSS v4** - All utility classes
- **DaisyUI v5** - Component library with themes
- **Custom component styles** - Styles for SimpleSvelte components

### Using with Vite

If you're using Vite, make sure to include the CSS in your `vite.config.ts`:

```typescript
// vite.config.ts
export default defineConfig({
	// ... other config
	css: {
		preprocessorOptions: {
			css: {
				additionalData: `@import 'simplesvelte/styles.css';`,
			},
		},
	},
})
```

### Themes

DaisyUI themes are included. You can change themes by adding the `data-theme` attribute:

```html
<html data-theme="dark">
	<!-- Your app -->
</html>
```

Available themes: `light`, `dark`, `cupcake`, and more.
