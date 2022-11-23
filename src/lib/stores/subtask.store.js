import models from "$lib/models";
import { writable } from "svelte/store";

export let activeSubtask = writable(models.task);