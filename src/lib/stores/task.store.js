import models from "$lib/models";
import { writable } from "svelte/store";

export let activeTask = writable(models.task)

export let addTaskPanelActive = writable(false)

export let newTaskName = writable('')

export let statuses = writable([
  {
    name: '',
    value: ''
  }
])

export let newTaskStatus = writable('')

export let newTaskMembers = writable([''])

export let newTaskDueDateTime = writable(new Date())

export let workspaceMembers = writable([
  {
    id: '',
    firstName: '',
    lastName: '',
    profile: '',
    email: '',
    online: false
  }
])

export let newTaskLevel = writable(1)

export let taskSettingsPanelActive = writable(false)

export let selectedTask = writable(models.task)

export let taskConfirmDeleteModalActive = writable(false)