<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { notifs } from '$lib/stores/global.store';
  import { Button, Dialog } from 'svelte-materialify'
  import { Pulse } from 'svelte-loading-spinners'
	import { workspaceLeaveModalActive } from '$lib/stores/workspace.store';
	import { activeWorkspace } from '$lib/stores/dashboard.store';

  export let data

  let leaving = false

  const leaveWorkspace = async () => {
    if(leaving) return
    leaving = true

    let form = document.getElementById('formleaveWorkspace')
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
        msg: 'Leaved successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      workspaceLeaveModalActive.set(false)
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    leaving = false
    workspaceLeaveModalActive.set(false)
  }

  const close = () => {
    workspaceLeaveModalActive.set(false)
  }
</script>

<form id='formleaveWorkspace' class="is-hidden" action="?/leaveWorkspace" use:enhance></form>

<Dialog persistent bind:active={$workspaceLeaveModalActive} class='p-2'>
  <div class="fredoka-reg txt-size-15">
    Do you want to leave the workspace {data.workspace.name}? <br> <span class="txt-size-15 rounded p-1 has-background-danger-light has-text-danger-dark">leave {data.workspace.name}</span>
  </div>
  <div class="maxmins-w-100p is-flex is-justify-content-flex-end mt-6">
    <Button
      size='small'
      depressed
      disabled={leaving}
      class='has-background-grey-lighter mr-3 {leaving ? 'is-hidden' : ''}'
      on:click={close}
    >
      Cancel
    </Button>
    <Button
      size='small'
      depressed
      class='has-background-grey-light'
      disabled={leaving}
      on:click={leaveWorkspace}
    >
      {#if !leaving}
        Confirm
      {:else}
        <Pulse size={20} color='#fff' />
      {/if}
    </Button>
  </div>
</Dialog>