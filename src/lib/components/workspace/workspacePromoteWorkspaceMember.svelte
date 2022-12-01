<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { notifs } from '$lib/stores/global.store';
  import { Button, Dialog } from 'svelte-materialify'
  import { Pulse } from 'svelte-loading-spinners'
	import { confirmationPromoteWorkspaceMemberModalActive, selectedMember } from '$lib/stores/workspace.store';

  let promoting = false

  const promoteMember = async () => {
    if(promoting) return
    promoting = true

    let form = document.getElementById('formPromoteMember')
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
        msg: 'Promoted successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    promoting = false
    selectedMember.set({
      id: '',
      online: false,
      firstName: '',
      lastName: '',
      email: '',
      profile: '',
      gender: ''
    })
    confirmationPromoteWorkspaceMemberModalActive.set(false)
  }

  const close = () => {
    confirmationPromoteWorkspaceMemberModalActive.set(false)
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

<form id='formPromoteMember' class="is-hidden" action="?/promoteMember" use:enhance>
  <input type="text" bind:value={$selectedMember.id} name='id'>
</form>

<Dialog persistent bind:active={$confirmationPromoteWorkspaceMemberModalActive} class='p-2'>
  <div class="fredoka-reg txt-size-15">
    Promoting {$selectedMember.gender === 'Male' ? 'him' : 'her'} as admin in the workspace will give {$selectedMember.gender === 'Male' ? 'him' : 'her'} more priviledges to work on this workspace. <span class="txt-size-15 rounded p-1 has-background-success-light has-text-success-dark">promote {$selectedMember.firstName} {$selectedMember.firstName}</span>
  </div>
  <div class="maxmins-w-100p is-flex is-justify-content-flex-end mt-6">
    <Button
      size='small'
      depressed
      disabled={promoting}
      class='has-background-grey-lighter mr-3 {promoting ? 'is-hidden' : ''}'
      on:click={close}
    >
      Cancel
    </Button>
    <Button
      size='small'
      depressed
      class='has-background-grey-light'
      disabled={promoting}
      on:click={promoteMember}
    >
      {#if !promoting}
        Confirm
      {:else}
        <Pulse size={20} color='#fff' />
      {/if}
    </Button>
  </div>
</Dialog>