<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import models from '$lib/models';
	import { notifs } from '$lib/stores/global.store';
  import { Button, Dialog } from 'svelte-materialify'
  import { Pulse } from 'svelte-loading-spinners'
	import { newTaskDueDateTime, newTaskLevel, newTaskName, newTaskStatus, selectedTask, taskConfirmDeleteModalActive, taskSettingsPanelActive } from '$lib/stores/task.store';

  let deleting = false

  const deleteTask = async () => {
    if(deleting) return
    deleting = true

    let form = document.getElementById('formDeleteTask')
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
    taskSettingsPanelActive.set(false)
    newTaskName.set('')
    newTaskStatus.set('')
    newTaskLevel.set(1)
    newTaskDueDateTime.set(new Date())
    selectedTask.set(models.task)
    taskConfirmDeleteModalActive.set(false)
  }

  const close = () => {
    if(deleting) return
    taskConfirmDeleteModalActive.set(false)
  }
</script>

<form id='formDeleteTask' class="is-hidden" action="?/deleteTask" use:enhance>
  <input type="text" bind:value={$selectedTask.id} name='id'>
</form>

<Dialog persistent bind:active={$taskConfirmDeleteModalActive} class='p-2'>
  <div class="fredoka-reg txt-size-15">
    Deleting this task will delete all subtasks, progresses, conversations and files under this task. Also this task will be automatically deleted to all members of this workspace. <span class="txt-size-15 rounded p-1 has-background-danger-light has-text-danger-dark">delete {$selectedTask.name}</span>
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
      on:click={deleteTask}
    >
      {#if !deleting}
        Confirm
      {:else}
        <Pulse size={20} color='#fff' />
      {/if}
    </Button>
  </div>
</Dialog>