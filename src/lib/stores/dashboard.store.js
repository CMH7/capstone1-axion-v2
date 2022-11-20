import models from "$lib/models";
import { writable } from "svelte/store";

export let activeSubject = writable(models.subject)

export let activeWorkspace = writable(models.workspace)

export let invModalActive = writable(false)