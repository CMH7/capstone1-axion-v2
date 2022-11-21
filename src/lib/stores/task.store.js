import models from "$lib/models";
import { writable } from "svelte/store";

export let activeTask = writable(models.task)