<script>
  //@ts-nocheck
  import { addTaskPanelActive, newTaskDueDateTime, newTaskLevel, newTaskMembers, newTaskName, newTaskStatus, statuses, workspaceMembers } from '$lib/stores/task.store'
  import { Button, Icon, MaterialApp, Textarea, Select, ClickOutside, TextField, Checkbox, Avatar } from 'svelte-materialify'
  import SveltyPicker from 'svelty-picker'
  import { mdiAccountCircleOutline, mdiClose } from '@mdi/js'
	import { global_USERID, navDrawerActive, notifCenterOpen, notifs } from '$lib/stores/global.store';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
  import { Pulse } from 'svelte-loading-spinners'

  const levels = [
    {name: 'Low', value: 1},
    {name: 'Medium', value: 2},
    {name: 'High', value: 3}
  ]

  /**
   * @type {string[]}
   */
  let group = []
  let innerWidth = 0
  let creating = false
  let addTaskAssigneeDropOpen = false
  let searchingFor = ''
  let searching = false
  let dateToday1 = new Date().toISOString()
  let dateToday = new Date(`${dateToday1.split('T')[0].split('-')[0]}-${dateToday1.split('T')[0].split('-')[1]}-${dateToday1.split('T')[0].split('-')[2]}T${dateToday1.split('T')[1].split(':')[0]}:${dateToday1.split('T')[1].split(':')[1]}:00Z`).toISOString()
  let newTask = {
    description: '',
    dueDateTime: `${dateToday.split('T')[0].split('-')[0]}-${dateToday.split('T')[0].split('-')[1]}-${dateToday.split('T')[0].split('-')[2]} ${dateToday.split('T')[1].split(':')[0]}:${dateToday.split('T')[1].split(':')[1]}`
  }

  $: taskNameError = $newTaskName === ''
  $: newTaskDueDateTime.set(new Date(`${newTask.dueDateTime.split(' ').join('T')}:00Z`))
  $: newTaskMembers.set(group)
  $: toSendDueDateTime = $newTaskDueDateTime.toISOString()
  $: toSendNewTaskMembers = $newTaskMembers.join(',')
  $: localWorkspaceMembers = $workspaceMembers
  $: searching ? searchingFor !== '' ? localWorkspaceMembers = localWorkspaceMembers.filter(lwm => `${lwm.firstName}${lwm.lastName} ${lwm.email}`.toLowerCase().match(searchingFor.toLowerCase())) : localWorkspaceMembers = $workspaceMembers : localWorkspaceMembers = $workspaceMembers

  const close = () => {
    if(creating) return
    newTaskName.set('')
    addTaskPanelActive.set(false)
  }

  const createTask = async () => {
    if(creating) return
    if($newTaskName === '') return
    if(!newTaskDueDateTime) return
    creating = true

    let form = document.getElementById('formAddTask')
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
      await invalidateAll();
    }

    applyAction(result);
    creating = false
    addTaskPanelActive.set(false)
    newTaskName.set('')
    newTaskLevel.set(1)
    newTaskMembers.set([])
    newTaskDueDateTime.set(new Date())
    group = []
  }

</script>

<svelte:window bind:innerWidth />

<form action="?/createTask" id='formAddTask' class="is-hidden" use:enhance>
  <input type="text" name='name' bind:value={$newTaskName}>
  <input type="text" name='description' bind:value={newTask.description}>
  <input type="number" name='level' bind:value={$newTaskLevel}>
  <input type="text" name='status' bind:value={$newTaskStatus}>
  <input type="text" name='dueDateTime' bind:value={toSendDueDateTime}>
  <input type="text" name='members' bind:value={toSendNewTaskMembers}>
  <input type="text" name='creator' bind:value={$global_USERID}>
</form>

<div
  class="has-transition z-{$notifCenterOpen || $navDrawerActive ? 'n100' : '30'} pos-fix p-2 pos-t-57 pos-r-0 maxmins-h-calc-100vh-65px maxmins-w-400-dt-to-mb-100p has-background-white-bis {!$addTaskPanelActive ? 'rot-y-90' : 'rot-y-0'} rounded-b elevation-4 is-flex is-flex-direction-column"
  style='transform-origin: top right'
>
  <!-- title -->
  <div class='maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center'>
    <div class='fredoka-reg is-size-6'>
      Add task
    </div>
    
    <Button
      icon
      disabled={creating}
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
          dense
          class='fredoka-reg'
          disabled={creating}
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
          disabled={creating}
          bind:value={newTask.description}
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
          dense
          outlined
          items={levels}
          disabled={creating}
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
          dense
          outlined
          mandatory
          disabled={creating}
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
          inputClasses="maxmins-w-100p rounded p-2 fredoka-reg is-clickable"
          format="yyyy-mm-dd hh:ii"
          bind:value={newTask.dueDateTime}
          clearBtn={false}
          todayBtn={false}
          required={true}
      />
    </div>
  </div>

  <!-- task assignee/s -->
  <div class="maxmins-w-100p mt-3 is-relative">
    <MaterialApp>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        use:ClickOutside
        on:clickOutside={() => {
          searching = false
          addTaskAssigneeDropOpen = false
        }}
        on:click={() => {
          if(creating) return
          searching = true
          addTaskAssigneeDropOpen = !addTaskAssigneeDropOpen
        }}
        class="has-background-white-bis"
      >
        <TextField
          color='grey'
          outlined
          dense
          disabled={creating}
          class='fredoka-reg'
          bind:value={searchingFor}
        >
          Assignee/s
        </TextField>
      </div>
    </MaterialApp>

    <div style='overflow-y: auto; transform-origin: top center;' class="pos-abs pos-l-0 pos-t-100p rounded maxmins-w-100p max-h-40v has-background-white elevation-2 p-2 has-transition rot-x-{addTaskAssigneeDropOpen ? '0' : '90'}">
      {#each localWorkspaceMembers as wm}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          on:click={() => {
            addTaskAssigneeDropOpen = true
          }}
          class='mb-3'
        >
          <Checkbox color='green' bind:group value="{wm.id}">
            <div class='maxmins-w-100p is-flex is-align-items-center'>
              <div>
                <Avatar size='18px'>
                  {#if wm.profile !== ''}
                    <img src="{wm.profile}" alt="{wm.firstName} {wm.lastName}">
                  {:else}
                    <Icon class='blue-text' path={mdiAccountCircleOutline} />
                  {/if}
                </Avatar>
              </div>
              
              <div class="ml-3 fredoka-reg has-text-grey">
                {wm.firstName} {wm.lastName}
              </div>
            </div>
          </Checkbox>
        </div>
      {/each}
    </div>
  </div>

  <div class='maxmins-w-100p flex-grow-1 is-flex is-flex-direction-column is-justify-content-flex-end'>
    <div class='maxmins-w-100p is-flex is-justify-content-flex-end'>
      <Button
        depressed
        class='has-background-grey-light has-text-white'
        on:click={createTask}
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