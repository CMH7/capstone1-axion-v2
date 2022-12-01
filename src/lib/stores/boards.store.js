import models from "$lib/models";
import { writable } from "svelte/store";

export let selectedBoard = writable(models.board)

export let showFilter = writable(false)

export let addBoardPanelActive = writable(false)

export let activeBoard = writable(models.board)

export let newBoardName = writable('')

export let boardSettingsPanelActive = writable(false)

export let deleteBoardConfirmationModalActive = writable(false) 