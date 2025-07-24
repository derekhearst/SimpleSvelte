import Swal, { type SweetAlertIcon, type SweetAlertPosition } from 'sweetalert2'
export class Pop {
	/**
	 * @param {string} title The title text.
	 * @param {string} text The body text.
	 * @param {string} confirmButtonText The text of your confirm button.
	 * @param {'success' | 'error' | 'info' | 'warning' | 'question'} icon Pop icon
	 *
	 * {@link https://sweetalert2.github.io/#configuration | Check out Sweet Alerts}
	 */
	static async confirm(
		title = 'Are you sure?',
		text = "You won't be able to revert this!",
		confirmButtonText = 'Yes',
		icon: SweetAlertIcon = 'warning',
	) {
		const newDialogEl = document.createElement('dialog')
		const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
		let randomId = ''
		for (let i = 0; i < 10; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length)
			randomId += characters[randomIndex]
		}
		newDialogEl.id = randomId
		document.body.appendChild(newDialogEl)
		try {
			newDialogEl.showModal()
			const res = await Swal.fire({
				title,
				text,
				icon,
				confirmButtonText,
				showCancelButton: true,
				reverseButtons: true,
				target: '#' + randomId,
				backdrop: false,
			})
			return res.isConfirmed
		} catch {
			console.log('popover not supported')
			const res = await Swal.fire({
				title,
				text,
				icon,
				confirmButtonText,
				showCancelButton: true,
				reverseButtons: true,
			})
			return res.isConfirmed
		} finally {
			newDialogEl.remove()
		}
	}

	/**
	 * @param {string} title The title text
	 * @param {'success' | 'error' | 'info' | 'warning' | 'question'} icon
	 * @param {'top' | 'top-start' | 'top-end' | 'center' | 'center-start' | 'center-end' | 'bottom' | 'bottom-start' | 'bottom-end'} position
	 * @param {number} timer Time in milliseconds.
	 * @param {boolean} progressBar Show progress bar or not respectively.
	 * -----------------------------------
	 * {@link https://sweetalert2.github.io/#configuration|Check out Sweet Alerts}
	 */

	static toast(
		title = 'Warning!',
		icon: SweetAlertIcon = 'warning',
		position: SweetAlertPosition = 'top-end',
		timer = 3000,
		progressBar = true,
	) {
		const newDialogEl = document.createElement('dialog')
		const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
		let randomId = ''
		for (let i = 0; i < 10; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length)
			randomId += characters[randomIndex]
		}
		newDialogEl.id = randomId
		newDialogEl.setAttribute('popover', '')
		document.body.appendChild(newDialogEl)
		try {
			newDialogEl.showPopover()
			Swal.fire({
				title,
				icon,
				position,
				timer,
				timerProgressBar: progressBar,
				toast: true,
				showConfirmButton: false,
				target: '#' + randomId,
			})
		} catch {
			console.log('popover not supported')
			Swal.fire({
				title,
				icon,
				position,
				timer,
				timerProgressBar: progressBar,
				toast: true,
				showConfirmButton: false,
			})
		} finally {
			setTimeout(() => {
				newDialogEl.close()
				newDialogEl.remove()
			}, timer)
		}
	}

	static error(error: Error | string, timer = 3000) {
		if (error instanceof Error) {
			this.toast(error.message, 'error', 'top-end', timer)
		} else {
			this.toast(error || error, 'error', 'top-end', timer)
		}
	}

	static success(message: string = 'Success!', timer = 3000) {
		this.toast(message, 'success', 'top-end', timer)
	}
}
