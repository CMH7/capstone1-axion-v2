<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { notifs } from '$lib/stores/global.store';
  import { Button, Dialog } from 'svelte-materialify'
  import { Pulse } from 'svelte-loading-spinners'
	import { confirmationDemoteWorkspaceAdminModalActive, selectedMember } from '$lib/stores/workspace.store';

  let removing = false

  const demoteAdmin = async () => {
    if(removing) return
    removing = true

    let form = document.getElementById('formDemoteAdmin')
    const data = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    if(result.type === 'invalid') {
      $notifs = [...$notifs, {
        msg: result.data.message,
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }

    if (result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Demoted successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
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
    confirmationDemoteWorkspaceAdminModalActive.set(false)
  }

  const close = () => {
    confirmationDemoteWorkspaceAdminModalActive.set(false)
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

<form id='formDemoteAdmin' class="is-hidden" action="?/demoteAdmin" use:enhance>
  <input type="text" bind:value={$selectedMember.id} name='id'>
</form>

<Dialog persistent bind:active={$confirmationDemoteWorkspaceAdminModalActive} class='p-2'>
  <div class="fredoka-reg txt-size-15">
    Demoting {$selectedMember.gender === 'Male' ? 'him' : 'her'} in the workspace will remove {$selectedMember.gender === 'Male' ? 'his' : 'her'} priviledges on this workspace. <span class="txt-size-15 rounded p-1 has-background-danger-light has-text-danger-dark">demote {$selectedMember.firstName} {$selectedMember.firstName}</span>
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
      on:click={demoteAdmin}
    >
      {#if !removing}
        Confirm
      {:else}
        <Pulse size={20} color='#fff' />
      {/if}
    </Button>
  </div>
</Dialog>