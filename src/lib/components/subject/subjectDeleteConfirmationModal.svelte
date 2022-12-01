<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import models from '$lib/models';
	import { modalChosenColor, notifs } from '$lib/stores/global.store';
	import { confirmDeleteModalActive, newSubjectName, selectedSubject, subjectSettingsPanelActive } from '$lib/stores/subject.store';
  import { Button, Dialog } from 'svelte-materialify'
  import { Pulse } from 'svelte-loading-spinners'

  let deleting = false

  const deleteSubject = async () => {
    if(deleting) return
    deleting = true

    let form = document.getElementById('formDeleteSubject')
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
    subjectSettingsPanelActive.set(false)
    modalChosenColor.set('primary')
    newSubjectName.set('')
    selectedSubject.set(models.subject)
    confirmDeleteModalActive.set(false)
  }

  const close = () => {
    confirmDeleteModalActive.set(false)
  }
</script>

<form id='formDeleteSubject' class="is-hidden" action="?/deleteSubject" use:enhance>
  <input type="text" bind:value={$selectedSubject.id} name='id'>
</form>

<Dialog persistent bind:active={$confirmDeleteModalActive} class='p-2'>
  <div class="fredoka-reg txt-size-15">
    Deleting this subject will delete also all workspaces and progresses made under this subject. Also this subject will be automatically deleted to all members of each workspaces. <span class="txt-size-15 rounded p-1 has-background-danger-light has-text-danger-dark">delete {$selectedSubject.name}</span>
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
      disabled={deleting}
      class='has-background-grey-light'
      on:click={deleteSubject}
    >
      {#if !deleting}
        Confirm
      {:else}
        <Pulse size={20} color='#fff' />
      {/if}
    </Button>
  </div>
</Dialog>