import { writable } from "svelte/store";

export let global_PASS = writable('')

export let global_USERID = writable('')

export let breadCrumbsItems = writable([{ text: 'Subjects', href: '#' }])

export let modalChosenColor = writable('primary')

export let notifCenterOpen = writable(false)

export let logoutModalActive = writable(false)

export let invModalActive = writable(false)

export let notifs = writable([])

export let loading = writable(false)

export let hintText = writable('')

export let navDrawerActive = writable(false)

export let loadingScreen = writable(false)