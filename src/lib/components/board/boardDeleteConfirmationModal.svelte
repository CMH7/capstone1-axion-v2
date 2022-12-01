<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import models from '$lib/models';
	import { modalChosenColor, notifs } from '$lib/stores/global.store';
  import { Button, Checkbox, Dialog, Select } from 'svelte-materialify'
  import { Pulse } from 'svelte-loading-spinners'
	import { boardSettingsPanelActive, deleteBoardConfirmationModalActive, newBoardName, selectedBoard } from '$lib/stores/boards.store';
	import { statuses } from '$lib/stores/task.store';

  let deleting = false
  let move = false
  let moveToID = $statuses[0].value

  $: moves = move ? 'move' : 'del'

  const deleteSubject = async () => {
    if(deleting) return
    deleting = true

    let form = document.getElementById('formDeleteBoard')
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
      $statuses = [...$statuses.filter(status => status.value !== result.data.value)]
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    deleting = false
    boardSettingsPanelActive.set(false)
    modalChosenColor.set('primary')
    newBoardName.set('')
    selectedBoard.set(models.board)
    deleteBoardConfirmationModalActive.set(false)
  }

  const close = () => {
    move = false
    deleteBoardConfirmationModalActive.set(false)
  }
</script>

<form id='formDeleteBoard' class="is-hidden" action="?/deleteBoard" use:enhance>
  <input type="text" bind:value={$selectedBoard.id} name='id'>
  <input type="text" bind:value={moves} name='move'>
  <input type="text" bind:value={moveToID} name='moveToID'>
</form>

<Dialog persistent bind:active={$deleteBoardConfirmationModalActive} class='p-2'>
  <div class="fredoka-reg txt-size-15">
    Deleting this board will default to all tasks to be deleted too. You have the option to move the tasks to other boards. Also this board will be automatically deleted to all members of this workspace. <span class="txt-size-15 rounded p-1 has-background-danger-light has-text-danger-dark">delete {$selectedBoard.name}</span>
  </div>
  {#if $selectedBoard.tasks.length != 0}
    <div class="maxmins-w-100p mt-3">
      <Checkbox bind:checked={move}>
        <div class='fredoka-reg txt-size-14'>
          Move tasks to other boards
        </div>
      </Checkbox>
    </div>
    {#if move}
      <Select dense outlined items={$statuses.filter(status => status.value !== $selectedBoard.id)} mandatory bind:value={moveToID} class='mt-6 fredoka-reg txt-size-14'>
        move to
      </Select>
    {/if}
  {/if}
  <div class="maxmins-w-100p is-flex is-justify-content-flex-end mt-{move ? '16' : '6'}">
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