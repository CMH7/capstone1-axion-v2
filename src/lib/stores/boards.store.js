import models from "$lib/models";
import { writable } from "svelte/store";

export let selectedBoard = writable(models.board)

export let boardSettingsModalActive = writable(false)

export let showFilter = writable(false)