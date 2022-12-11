import { addBoardPanelActive, boardSettingsPanelActive, deleteBoardConfirmationModalActive } from "$lib/stores/boards.store"
import { addSubjectPanelActive, confirmDeleteModalActive, subjectSettingsPanelActive } from "$lib/stores/subject.store"
import { addTaskPanelActive, taskConfirmDeleteModalActive, taskSettingsPanelActive } from "$lib/stores/task.store"
import { addWorkspacePanelActive, confirmationDemoteWorkspaceAdminModalActive, confirmationPromoteWorkspaceMemberModalActive, confirmationRemoveWorkspaceMemberModalActive, confirmDeleteWorkspaceModalActive, workspaceSettingsPanelActive } from "$lib/stores/workspace.store"

export default {
  resetPanels: () => {
    addSubjectPanelActive.set(false)
    subjectSettingsPanelActive.set(false)
    confirmDeleteModalActive.set(false)
    addWorkspacePanelActive.set(false)
    workspaceSettingsPanelActive.set(false)
    confirmDeleteWorkspaceModalActive.set(false)
    addTaskPanelActive.set(false)
    taskSettingsPanelActive.set(false)
    taskConfirmDeleteModalActive.set(false)
    addBoardPanelActive.set(false)
    boardSettingsPanelActive.set(false)
    deleteBoardConfirmationModalActive.set(false)
    confirmationDemoteWorkspaceAdminModalActive.set(false)
    confirmationPromoteWorkspaceMemberModalActive.set(false)
    confirmationRemoveWorkspaceMemberModalActive.set(false)
  }
}