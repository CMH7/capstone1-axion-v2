import { writable } from "svelte/store";

export let addWorkspacePanelActive = writable(false)

export let viewMembersNow = writable(false)

export let manageMembersPanelActive = writable(false)

export let manageAdminPanelActive = writable(false)

export let workspaceSettingsPanelActive = writable(false)

export let leaveWorkspacePanelActive = writable(false)

export let addTaskPanelActive = writable(false)