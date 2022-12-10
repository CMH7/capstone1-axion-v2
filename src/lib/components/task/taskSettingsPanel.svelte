<script>
  //@ts-nocheck
  import { newTaskDueDateTime, newTaskLevel, newTaskMembers, newTaskName, newTaskStatus, selectedTask, statuses, taskConfirmDeleteModalActive, taskSettingsPanelActive } from '$lib/stores/task.store'
  import { Button, Icon, MaterialApp, Textarea, Select, TextField } from 'svelte-materialify'
  import SveltyPicker from 'svelty-picker'
  import { mdiClose } from '@mdi/js'
	import { notifs } from '$lib/stores/global.store';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
  import { Pulse } from 'svelte-loading-spinners'

  const levels = [
    {name: 'Low', value: 1},
    {name: 'Medium', value: 2},
    {name: 'High', value: 3}
  ]

  let innerWidth = 0
  let updating = false
  
  $: firstCopyDesc = $selectedTask.description
  $: dateToday1 = $newTaskDueDateTime.toISOString()
  $: dateToday = new Date(`${dateToday1.split('T')[0].split('-')[0]}-${dateToday1.split('T')[0].split('-')[1]}-${dateToday1.split('T')[0].split('-')[2]}T${dateToday1.split('T')[1].split(':')[0]}:${dateToday1.split('T')[1].split(':')[1]}:00Z`).toISOString()
  $: newTaskDesc = firstCopyDesc
  $: newTaskDue = `${dateToday.split('T')[0].split('-')[0]}-${dateToday.split('T')[0].split('-')[1]}-${dateToday.split('T')[0].split('-')[2]} ${dateToday.split('T')[1].split(':')[0]}:${dateToday.split('T')[1].split(':')[1]}`
  $: taskNameError = $newTaskName === ''
  $: toSendDueDateTime = newTaskDue !== '' ? new Date(`${newTaskDue.split(' ')[0].split('-')[0]}-${newTaskDue.split(' ')[0].split('-')[1]}-${newTaskDue.split(' ')[0].split('-')[2]}T${newTaskDue.split(' ')[1].split(':')[0]}:${newTaskDue.split(' ')[1].split(':')[1]}:00Z`).toISOString() : ''

  const close = () => {
    if(updating) return
    newTaskName.set('')
    taskSettingsPanelActive.set(false)
  }

  const updateTask = async () => {
    if(updating) return
    if($newTaskName === '') return
    if(!newTaskDueDateTime) return
    updating = true

    let form = document.getElementById($selectedTask.id)
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
      // re-run all `load` functions, following the successful update
      $notifs = [...$notifs, {
        msg: 'Updated successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      await invalidateAll();
    }

    applyAction(result);
    updating = false
    taskSettingsPanelActive.set(false)
    newTaskName.set('')
    newTaskLevel.set(1)
    newTaskMembers.set([])
    newTaskDueDateTime.set(new Date())
    newTaskDesc = ''
    newTaskDue = ''
  }

  const deleteTask = async () => {
    taskConfirmDeleteModalActive.set(true)
  }
</script>

<svelte:window bind:innerWidth />

<form action="?/updateTask" id='{$selectedTask.id}' class="is-hidden" use:enhance>
  <input type="text" name='name' bind:value={$newTaskName}>
  <input type="text" name='description' bind:value={newTaskDesc}>
  <input type="number" name='level' bind:value={$newTaskLevel}>
  <input type="text" name='status' bind:value={$newTaskStatus}>
  <input type="text" name='dueDateTime' bind:value={toSendDueDateTime}>
  <input type="text" name='id' bind:value={$selectedTask.id}>
</form>

<div
  class="has-transition z-{$taskConfirmDeleteModalActive ? '1' : '99'} pos-abs p-2 pos-t-57 pos-r-0 maxmins-h-calc-100vh-65px maxmins-w-400-dt-to-mb-100p has-background-white-bis {!$taskSettingsPanelActive ? innerWidth < 571 ? 'rot-x-90' : 'rot-y-90': innerWidth < 571 ? 'rot-x-0' : 'rot-y-0'} rounded-b elevation-4 is-flex is-flex-direction-column"
  style='transform-origin: top right'
>
  <!-- title -->
  <div class='maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center'>
    <div class='fredoka-reg is-size-6'>
      Task settings
    </div>
    
    <Button
      icon
      disabled={updating}
      on:click={close}
    >
      <Icon class='has-text-danger' path={mdiClose} />
    </Button>
  </div>

  <!-- task name -->
  <div class="maxmins-w-100p mt-3">
    <MaterialApp>
      <div class="has-background-white-bis">
        <TextField
          color='grey'
          outlined
          class='fredoka-reg'
          disabled={updating}
          error={taskNameError}
          rules={[
            /** @param {string} v*/ v => v !== '' || 'Task name cannot be empty'
          ]}
          bind:value={$newTaskName}
        >
          Task name
        </TextField>
      </div>
    </MaterialApp>
  </div>
  
  <!-- task description -->
  <div class="maxmins-w-100p mt-3">
    <MaterialApp>
      <div class="has-background-white-bis">
        <Textarea
          rows={2}
          outlined
          color='grey'
          disabled={updating}
          bind:value={newTaskDesc}
        >
          Description
        </Textarea>
      </div>
    </MaterialApp>
  </div>
  
  <!-- task level -->
  <div class="maxmins-w-100p mt-3">
    <MaterialApp>
      <div class="has-background-white-bis">
        <Select
          outlined
          items={levels}
          disabled={updating}
          mandatory
          bind:value={$newTaskLevel}
          class='fredoka-reg'
        >
          Priority
        </Select>
      </div>
    </MaterialApp>
  </div>

  <!-- task status -->
  <div class="maxmins-w-100p mt-3">
    <MaterialApp>
      <div class="has-background-white-bis">
        <Select
          outlined
          mandatory
          disabled={updating}
          items={$statuses}
          bind:value={$newTaskStatus}
          class='fredoka-reg'
        >
          Status
        </Select>
      </div>
    </MaterialApp>
  </div>

  <!-- due date time -->
  <div class="maxmins-w-100p mt-3">
    <div style='border: 1px solid rgba(0, 0, 0, 0.4); overflow: hidden;' class='rounded'>
      <SveltyPicker
          placeholder="Due date"
          inputClasses="maxmins-w-100p rounded px-2 py-4 fredoka-reg is-clickable"
          format="yyyy-mm-dd hh:ii"
          bind:value={newTaskDue}
          clearBtn={false}
          todayBtn={false}
          required={true}
      />
    </div>
  </div>

  <div class='maxmins-w-100p flex-grow-1 is-flex is-flex-direction-column is-justify-content-flex-end'>
    <div class='maxmins-w-100p is-flex is-justify-content-space-between'>
      <Button
        depressed
        class='has-background-danger has-text-white {updating ? 'opacity-0p' : ''}'
        on:click={deleteTask}
      >
        Delete
      </Button>
      <Button
        depressed
        class='has-background-grey-light has-text-white'
        on:click={updateTask}
      >
        {#if !updating}
          Update
        {:else}
          <Pulse size={20} color='#fff' />
        {/if}
      </Button>
    </div>
  </div>

</div>