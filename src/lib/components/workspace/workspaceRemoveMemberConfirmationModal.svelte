<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import models from '$lib/models';
	import { modalChosenColor, notifs } from '$lib/stores/global.store';
  import { Button, Dialog } from 'svelte-materialify'
  import { Pulse } from 'svelte-loading-spinners'
	import { confirmationRemoveWorkspaceMemberModalActive, confirmDeleteWorkspaceModalActive, newWorkspaceName, selectedMember, selectedWorkspace, workspaceSettingsPanelActive } from '$lib/stores/workspace.store';
	import { activeWorkspace } from '$lib/stores/dashboard.store';

  let removing = false

  const removeMember = async () => {
    if(removing) return
    removing = true

    let form = document.getElementById('formRemoveMember')
    const data = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    console.log(result);

    if(result.type === 'invalid') {
      $notifs = [...$notifs, {
        msg: result.data.message,
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }

    if (result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Removed successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      activeWorkspace.set(result.data.workspace)
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    removing = false
    selectedMember.set({
      id: '',
      online: false,
      firstName: '',
      lastName: '',
      email: '',
      profile: '',
      gender: ''
    })
    confirmationRemoveWorkspaceMemberModalActive.set(false)
  }

  const close = () => {
    confirmationRemoveWorkspaceMemberModalActive.set(false)
    selectedMember.set({
      email: '',
      firstName: '',
      lastName: '',
      profile: '',
      online: false,
      gender: '',
      id: ''
    })
  }
</script>

<form id='formRemoveMember' class="is-hidden" action="?/removeMember" use:enhance>
  <input type="text" bind:value={$selectedMember.id} name='id'>
</form>

<Dialog persistent bind:active={$confirmationRemoveWorkspaceMemberModalActive} class='p-2'>
  <div class="fredoka-reg txt-size-15">
    Removing {$selectedMember.gender === 'Male' ? 'him' : 'her'} in the workspace will remove {$selectedMember.gender === 'Male' ? 'him' : 'her'} to all tasks that is assigned to {$selectedMember.gender === 'Male' ? 'him' : 'her'} also all progresses, files, and chats and tasks {$selectedMember.gender === 'Male' ? 'he' : 'she'} made under this workspace will be deleted. <span class="txt-size-15 rounded p-1 has-background-danger-light has-text-danger-dark">remove {$selectedMember.firstName} {$selectedMember.firstName}</span>
  </div>
  <div class="maxmins-w-100p is-flex is-justify-content-flex-end mt-6">
    <Button
      size='small'
      depressed
      disabled={removing}
      class='has-background-grey-lighter mr-3 {removing ? 'is-hidden' : ''}'
      on:click={close}
    >
      Cancel
    </Button>
    <Button
      size='small'
      depressed
      class='has-background-grey-light'
      disabled={removing}
      on:click={removeMember}
    >
      {#if !removing}
        Confirm
      {:else}
        <Pulse size={20} color='#fff' />
      {/if}
    </Button>
  </div>
</Dialog>