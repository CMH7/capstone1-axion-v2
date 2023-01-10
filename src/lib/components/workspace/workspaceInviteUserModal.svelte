<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { notifs } from '$lib/stores/global.store';
  import { Button, Dialog, Icon } from 'svelte-materialify'
  import { Pulse } from 'svelte-loading-spinners'
	import { workspaceInviteUserModalActive, selectedMember } from '$lib/stores/workspace.store';
	import { mdiClose } from '@mdi/js';

  let inviting = false

  $: uiName = `${$selectedMember.firstName} ${$selectedMember.lastName}`

  const inviteUser = async () => {
    if(inviting) return
    inviting = true

    let form = document.getElementById('formInviteUser')
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
        msg: 'Invited successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    inviting = false
    selectedMember.set({
      id: '',
      online: false,
      firstName: '',
      lastName: '',
      email: '',
      profile: '',
      gender: ''
    })
    workspaceInviteUserModalActive.set(false)
  }

  const close = () => {
    workspaceInviteUserModalActive.set(false)
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

<form id='formInviteUser' class="is-hidden" action="?/inviteUser" use:enhance>
  <input type="text" name='iuID' bind:value={$selectedMember.id}>
  <input type="text" name='iuName' bind:value={uiName}>
  <input type="text" name='iuProfile' bind:value={$selectedMember.profile}>
</form>

<Dialog persistent bind:active={$workspaceInviteUserModalActive} class='p-2'>
  <div class='maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center mb-5'>
    <div class='fredoka-reg txt-size-20'>
      Invite user
    </div>

    <Button icon size='small' on:click={close}>
      <Icon class='red-text' path={mdiClose} />
    </Button>
  </div>

  <div class="fredoka-reg txt-size-15 px-3">
    Invite {$selectedMember.firstName} {$selectedMember.lastName} to the workspace?. <span class="txt-size-15 rounded p-1 has-background-success-light has-text-success-dark">Invite {$selectedMember.firstName} {$selectedMember.lastName}</span>
  </div>
  <div class="maxmins-w-100p is-flex is-justify-content-flex-end mt-6">
    <Button
      size='small'
      depressed
      class='has-background-grey-light'
      disabled={inviting}
      on:click={inviteUser}
    >
      {#if !inviting}
        Confirm
      {:else}
        <Pulse size={20} color='#fff' />
      {/if}
    </Button>
  </div>
</Dialog>