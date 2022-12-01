<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import models from '$lib/models';
	import { modalChosenColor, notifs } from '$lib/stores/global.store';
	import { confirmDeleteModalActive, newSubjectName, selectedSubject, subjectSettingsPanelActive } from '$lib/stores/subject.store';
  import { Button, Dialog } from 'svelte-materialify'
  import { Pulse } from 'svelte-loading-spinners'
	import { confirmDeleteWorkspaceModalActive, newWorkspaceName, selectedWorkspace, workspaceSettingsPanelActive } from '$lib/stores/workspace.store';

  let deleting = false

  const deleteWorkspace = async () => {
    if(deleting) return
    deleting = true

    let form = document.getElementById('formDeleteWorkspace')
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
        msg: 'Deleted successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    deleting = false
    workspaceSettingsPanelActive.set(false)
    modalChosenColor.set('primary')
    newWorkspaceName.set('')
    selectedWorkspace.set(models.workspace)
    confirmDeleteWorkspaceModalActive.set(false)
  }

  const close = () => {
    confirmDeleteWorkspaceModalActive.set(false)
  }
</script>

<form id='formDeleteWorkspace' class="is-hidden" action="?/deleteWorkspace" use:enhance>
  <input type="text" bind:value={$selectedWorkspace.id} name='id'>
</form>

<Dialog persistent bind:active={$confirmDeleteWorkspaceModalActive} class='p-2'>
  <div class="fredoka-reg txt-size-15">
    Deleting this workspace will delete also all progresses, files, members, chats and tasks made under this workspace. Also this workspace will be automatically deleted to all members of this workspace. <span class="txt-size-15 rounded p-1 has-background-danger-light has-text-danger-dark">delete {$selectedWorkspace.name}</span>
  </div>
  <div class="maxmins-w-100p is-flex is-justify-content-flex-end mt-6">
    <Button
      size='small'
      depressed
      disabled={deleting}
      class='has-background-grey-lighter mr-3 {deleting ? 'is-hidden' : ''}'
      on:click={close}
    >
      Cancel
    </Button>
    <Button
      size='small'
      depressed
      class='has-background-grey-light'
      disabled={deleting}
      on:click={deleteWorkspace}
    >
      {#if !deleting}
        Confirm
      {:else}
        <Pulse size={20} color='#fff' />
      {/if}
    </Button>
  </div>
</Dialog>