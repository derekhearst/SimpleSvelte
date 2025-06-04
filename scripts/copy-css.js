import fs from 'fs'
import path from 'path'

const sourcePath = path.resolve('./dist/styles.css')
const targetPath = path.resolve('./dist/index.css')

console.log('Attempting to copy:', sourcePath, 'to', targetPath)

if (fs.existsSync(sourcePath)) {
	fs.copyFileSync(sourcePath, targetPath)
	console.log('CSS file copied successfully')
} else {
	console.log('Source CSS file not found at:', sourcePath)
}
