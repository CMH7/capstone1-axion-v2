import { writable } from "svelte/store";

export let uploadPicModalActive = writable(false)

export let changePassCodeModalActive = writable(false)

export let changeEmailCodeModalActive = writable(false)

export let newPassword = writable('')

export let newEmailNew = writable('')

export let deleteAccoutConfirmationModalActive = writable(false)