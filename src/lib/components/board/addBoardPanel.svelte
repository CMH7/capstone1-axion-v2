<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidate, invalidateAll } from '$app/navigation';
	import { modalChosenColor, navDrawerActive, notifs } from '$lib/stores/global.store';
	import { mdiClose } from '@mdi/js';
	import { TextField, Button, Icon, Divider} from 'svelte-materialify';
  import { Pulse } from 'svelte-loading-spinners'
	import { addBoardPanelActive, newBoardName } from '$lib/stores/boards.store';
	import { activeWorkspace } from '$lib/stores/dashboard.store';
	import { statuses } from '$lib/stores/task.store';

  const colors = ["primary", "link", "info", "success", "warning", "danger"]
  
  let creating = false
  let innerWidth = 0

  $: boardNameError = $newBoardName === '' || $newBoardName.split(' ').join('').toLowerCase() === 'todo' || $newBoardName.split(' ').join('').toLowerCase() === 'inprogress' || $newBoardName.split(' ').join('').toLowerCase() === 'done'

  const createBoard = async () => {
    if(creating) return
    if($newBoardName === '') return
    if($newBoardName.length > 20) return
    if($newBoardName.split(' ').join('').toLowerCase() === 'todo' || $newBoardName.split(' ').join('').toLowerCase() === 'inprogress' || $newBoardName.split(' ').join('').toLowerCase() === 'done') return
    creating = true

    let form = document.getElementById('formAddBoard')
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
      // re-run all `load` functions, following the successful update
      $notifs = [...$notifs, {
        msg: 'Created successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      let statusesCopy = $statuses
      statusesCopy.splice(statusesCopy.length - 1, 0, result.data)
      statuses.set(statusesCopy)
      await invalidateAll();
    }

    applyAction(result);
    creating = false
    addBoardPanelActive.set(false)
    modalChosenColor.set('primary')
    newBoardName.set('')
  }
</script>

<svelte:window bind:innerWidth />

<form id='formAddBoard' class="is-hidden" action="?/createBoard" use:enhance>
  <input type="text" bind:value={$newBoardName} name='name'>
  <input type="text" bind:value={$modalChosenColor} name='color'>
  <input type="text" bind:value={$activeWorkspace.id} name='workspaceID'>
</form>

<div
  class="has-transition z-{$navDrawerActive ? 'n100' : '30'} pos-fix p-2 pos-t-57 pos-r-0 maxmins-h-calc-100vh-65px maxmins-w-400-dt-to-mb-100p has-background-white-bis {!$addBoardPanelActive ? 'rot-y-90' : 'rot-y-0'} rounded-b elevation-4 is-flex is-flex-direction-column"
  style='transform-origin: top right'
>
  <!-- title -->
  <div class='maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center'>
    <div class="fredoka-reg is-size-6-desktop is-size-7-touch">
      Add board/status
    </div>
  
    <Button
      icon
      disabled={creating}
      on:click={() => {
        if(creating) return
        newBoardName.set('')
        addBoardPanelActive.set(false)
      }}
    >
      <Icon class='has-text-danger' path={mdiClose} />
    </Button>
  </div>

  <Divider class='mt-2' />

  <div class="has-background-white-bis">
    <TextField
      outlined
      color='indigo darken-4'
      class='fredoka-reg mb-4'
      required
      counter={20}
      disabled={creating}
      error={boardNameError}
      bind:value={$newBoardName}
      rules={[
        /** @param {string} v*/ v => v !== '' || 'Board name cannot be empty',
        /** @param {string} v*/ v => v.length <= 20 || 'Board name must be only 20 or less characters (except 0)',
        /** @param {string} v*/ v => v.split(' ').join('').toLowerCase() !== 'todo' || 'Board cannot be named after reserved board name [\'Todo\']',
        /** @param {string} v*/ v => v.split(' ').join('').toLowerCase() !== 'inprogress' || 'Board cannot be named after reserved board name [\'In progress\']',
        /** @param {string} v*/ v => v.split(' ').join('').toLowerCase() !== 'done' || 'Board cannot be named after reserved board name [\'Done\']',
      ]}
    >
      Board/status name
    </TextField>
  </div>

  <div class="maxmins-w-100p is-flex is-justify-content-center is-flex-wrap-wrap">
    {#each colors as color}
      <div class="maxmins-w-30p centerxy min-h-fit-content py-3">
        <Button
          fab
          depressed
          disabled={creating}
          size='large'
          class='has-background-{color} centerxy'
          on:click={() => modalChosenColor.set(color)}
        >
          <div class="rounded-circle maxmins-w-10 maxmins-h-10 has-background-white {$modalChosenColor === color ? '' : 'is-hidden'}"/>
        </Button>
      </div>
    {/each}
  </div>

  <div class="maxmins-w-100p flex-grow-1 pr-3 pb-3 is-flex is-flex-direction-column is-justify-content-flex-end">
    <div class="maxmins-w-100p is-flex is-justify-content-flex-end">
      <Button
        depressed
        class='has-background-grey-light'
        disabled={creating}
        on:click={createBoard}
      >
        {#if !creating}
          Create
        {:else}
          <Pulse size={20} color='#fff' />
        {/if}
      </Button>
    </div>
  </div>
</div>