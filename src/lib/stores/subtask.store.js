import models from "$lib/models";
import { writable } from "svelte/store";

export let activeSubtask = writable(models.task);

export let newSubtaskName = writable('')

export let newSubtaskDescription = writable('')

export let newSubtaskLevel = writable(1)

export let newSubtaskStatus = writable('')

export let newSubtaskDue = writable('')