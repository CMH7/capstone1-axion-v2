import models from "$lib/models";
import { writable } from "svelte/store";

export let addWorkspacePanelActive = writable(false)

export let manageMembersPanelActive = writable(false)

export let manageAdminPanelActive = writable(false)

export let workspaceSettingsPanelActive = writable(false)

export let leaveWorkspacePanelActive = writable(false)

export let newWorkspaceName = writable('')

export let selectedWorkspace = writable(models.workspace)

export let confirmDeleteWorkspaceModalActive = writable(false)

export let confirmationRemoveWorkspaceMemberModalActive = writable(false)

export let confirmationDemoteWorkspaceAdminModalActive = writable(false)

export let confirmationPromoteWorkspaceMemberModalActive = writable(false)

export let selectedMember = writable({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  profile: '',
  online: false,
  gender: ''
})