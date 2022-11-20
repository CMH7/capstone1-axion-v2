import { writable } from "svelte/store";

export let global_PASS = writable('')

export let breadCrumbsItems = writable([{ text: 'Subjects', href: '#' }])

export let modalChosenColor = writable('primary')

export let notifCenterOpen = writable(false)

export let logoutModalActive = writable(false)

export let invModalActive = writable(false)

export let notifs = writable([{ msg: '', type: '', id: '' }])

export let loading = writable(false)

export let hintText = writable('')