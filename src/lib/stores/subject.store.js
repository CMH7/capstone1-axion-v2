import models from "$lib/models";
import { writable } from "svelte/store";

export let addSubjectPanelActive = writable(false)

export let newSubjectName = writable('')

export let subjectSettingsPanelActive = writable(false)

export let selectedSubject = writable(models.subject)

export let confirmDeleteModalActive = writable(false)