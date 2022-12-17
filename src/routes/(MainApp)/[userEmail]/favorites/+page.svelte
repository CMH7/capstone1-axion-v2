<script>
  //@ts-nocheck
	import { goto } from '$app/navigation';
	import NothingFound from '$lib/components/nothingFound.svelte';
	import SubjectBox from '$lib/components/subject/subjectBox.svelte';
	import TaskCard from '$lib/components/task/task-card.svelte';
	import WorkspaceBox from '$lib/components/workspace/workspaceBox.svelte';
	import helpers from '$lib/configs/helpers';
  import { breadCrumbsItems, currentIndex, global_USERID, hintText, loadingScreen, notifs } from '$lib/stores/global.store';
	import { statuses } from '$lib/stores/task.store';
	import { mdiAlphaSBox, mdiAlphaTBox, mdiAlphaWBox, mdiMagnify } from '@mdi/js';
	import bcryptjs from 'bcryptjs';
	import { onMount } from 'svelte';
	import { Checkbox, Icon, Select, Tab, Tabs, TextField, Window, WindowItem } from 'svelte-materialify';

  /**
   * @type {import('./$types').PageServerData}
   * */
  export let data

  /**
   * @type {{taskID: string, members: {id: string, firstName: string, lastName: string, profile: string, online: boolean, email: string}[]}[]}
   * */
  let taskMembers = []
  /**
   * @type {
   *  {
   *    workspaceID: string,
   *    statuses: {
   *      value: string,
   *      name: string
   *    }[]
   *  }[]
   * }
   */
  let workspaceStatuses = []
  let currentWindow = 0
  let innerWidth = 0
  let subjectCreated = true
  let subjectJoined = true 
  let workspaceCreated = true
  let workspaceJoined = true
  let taskHigh = true
  let taskMedium = true
  let taskLow = true
  let subjectSort = [
    {name: 'Ascending', value: 1},
    {name: 'Descending', value: 2}
  ]
  let workspaceSort = [
    {name: 'Ascending', value: 1},
    {name: 'Descending', value: 2},
  ]
  let taskSort = [
    {name: 'A-Z', value: 1},
    {name: 'Z-A', value: 2},
    {name: 'High-Low', value: 3},
    {name: 'Low-High', value: 4},
    {name: 'Upcoming-Overdue', value: 5},
    {name: 'Overdue-Upcoming', value: 6},
  ]
  let currentSubjectSort = 1
  let currentWorkspaceSort = 1
  let currentTaskSort = 1
  let searchFor = ''

  $: clientSubjects = data.favsubjects
  $: clientWorkspaces = data.favworkspaces
  $: clientTasks = data.favtasks
  $: update(data)
  $: filter(data)
  $: filter = (/** @type {import('./$types').PageServerData} */data) => {
    if(currentWindow == 0) {
      clientSubjects = data.favsubjects
      if(!subjectCreated) {
        clientSubjects = clientSubjects.filter(cs => cs.owner !== data.user.id)
      }
      if(!subjectJoined) {
        clientSubjects = clientSubjects.filter(cs => cs.owner === data.user.id)
      }

      // Ascending
      if(currentSubjectSort == 1) {
        clientSubjects.sort((a, b) => {
          if(a.name > b.name) return 1
          if(a.name < b.name) return -1
          return 0
        })
      }
      
      // Descending
      if(currentSubjectSort == 2) {
        clientSubjects.sort((a, b) => {
          if(a.name < b.name) return 1
          if(a.name > b.name) return -1
          return 0
        })
      }

      if(searchFor !== '') {
        clientSubjects = clientSubjects.filter(cs => cs.name.toLowerCase().match(searchFor.toLowerCase()))
      }
    }
    
    if(currentWindow == 1) {
      clientWorkspaces = data.favworkspaces
      if(!workspaceCreated) {
        clientWorkspaces = clientWorkspaces.filter(cw => cw.owner !== data.user.id)
      }
      if(!workspaceJoined) {
        clientWorkspaces = clientWorkspaces.filter(cw => cw.owner === data.user.id)
      }

      // Ascending
      if(currentWorkspaceSort == 1) {
        clientWorkspaces.sort((a, b) => {
          if(a.name > b.name) return 1
          if(a.name < b.name) return -1
          return 0
        })
      }
      
      // Descending
      if(currentWorkspaceSort == 2) {
        clientWorkspaces.sort((a, b) => {
          if(a.name < b.name) return 1
          if(a.name > b.name) return -1
          return 0
        })
      }

      if(searchFor !== '') {
        clientWorkspaces = clientWorkspaces.filter(cw => cw.name.toLowerCase().match(searchFor.toLowerCase()))
      }
    }

    if(currentWindow == 2) {
      clientTasks = data.favtasks

      if(!taskHigh) {
        clientTasks = clientTasks.filter(ct => ct.level !== 3)
      }

      if(!taskMedium) {
        clientTasks = clientTasks.filter(ct => ct.level !== 2)
      }
      
      if(!taskLow) {
        clientTasks = clientTasks.filter(ct => ct.level !== 1)
      }

      if(searchFor !== '') {
        clientTasks = clientTasks.filter(ct => `${searchFor.length >= 3 ? ct.id.substring(21, ):''}${ct.name}`.toLowerCase().match(searchFor.toLowerCase()))
      }

      if(currentTaskSort == 1) {
        clientTasks.sort((a, b) => {
          if(a.name > b.name) return 1
          if(a.name < b.name) return -1
          return 0
        })
      }
      
      if(currentTaskSort == 2) {
        clientTasks.sort((a, b) => {
          if(a.name < b.name) return 1
          if(a.name > b.name) return -1
          return 0
        })
      }
      
      if(currentTaskSort == 3) {
        clientTasks.sort((a, b) => {
          if(a.level < b.level) return 1
          if(a.level > b.level) return -1
          return 0
        })
      }
      
      if(currentTaskSort == 4) {
        clientTasks.sort((a, b) => {
          if(a.level > b.level) return 1
          if(a.level < b.level) return -1
          return 0
        })
      }

      if(currentTaskSort == 5) {
        clientTasks.sort((a, b) => {
          if(a.dueDateTime < b.dueDateTime) return 1
          if(a.dueDateTime > b.dueDateTime) return -1
          return 0
        })
      }
      
      if(currentTaskSort == 6) {
        clientTasks.sort((a, b) => {
          if(a.dueDateTime > b.dueDateTime) return 1
          if(a.dueDateTime < b.dueDateTime) return -1
          return 0
        })
      }
    }
  }
  $: update = (data) => {
    taskMembers = []
    workspaceStatuses = []

    data.favtasks.forEach((task) => {
      taskMembers = [...taskMembers, { taskID: task.id, members: [] }];
    });
    data.allMembers.forEach((member) => {
      data.favtasks.forEach((task) => {
        if (taskMembers.length != 0) {
          if (taskMembers.filter((tm) => tm.taskID === task.id).length != 0) {
            taskMembers.every((tm) => {
              if (tm.taskID === task.id) {
                if (task.members.includes(member.id)) {
                  tm.members = [...tm.members, member];
                }
                return false;
              }
              return true;
            });
          } else {
            if (task.members.includes(member.id)) {
              taskMembers = [...taskMembers, { taskID: task.id, members: [member] }];
            }
          }
        } else {
          if (task.members.includes(member.id)) {
            taskMembers = [{ taskID: task.id, members: [member] }];
          }
        }
      });
    });

    statuses.set(data.boards.map(board => {return{name: board.name, value: board.id}}))

    data.workspaces.forEach(w => {
      workspaceStatuses = [
        ...workspaceStatuses,
        {
          workspaceID: w.id,
          statuses: data.allStatusesFavorites.filter(stat => w.boards.includes(stat.value))
        }
      ]
    })
  }
  $: global_USERID.set(data.user.id)

  const handleRightClick = (task) => {
    statuses.set(workspaceStatuses.filter(ws => ws.statuses.some(y => y.value === task.status))[0].statuses)
  }

  onMount(() => {
    if(!bcryptjs.compareSync(localStorage.getItem('xxx'), data.user.password)) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Unauthorized accessing',
          type: 'warn',
          id: (Math.random() * 99) + 1
        }
      ]
      goto('/Signin', {replaceState: true})
      return
    }
    currentIndex.set(2)
    $breadCrumbsItems = [{text: 'Favorites', href: '#'}]
    loadingScreen.set(false)
    helpers.resetPanels()
  })
</script>

<svelte:window bind:innerWidth />

<div>
  <!-- header -->
  <div class='is-flex is-justify-content-space-between {innerWidth < 571 ? 'is-flex-wrap-wrap' : ''}'>
    <Tabs showArrows={false} bind:value={currentWindow} fixedTabs={innerWidth < 571} class='{innerWidth < 571 ? 'maxmins-w-100p mb-1' : ''}'>
      <div slot="tabs">
        <Tab activeClass='grey lighten-2 black-text' class='is-flex'>
          <Icon path={mdiAlphaSBox} />
          {#if innerWidth > 570}
            ubjects
          {/if}
        </Tab>
        <Tab activeClass='grey lighten-2 black-text' class='is-flex'>
          <Icon path={mdiAlphaWBox} />
          {#if innerWidth > 570}
            orkspaces
          {/if}
        </Tab>
        <Tab activeClass='grey lighten-2 black-text' class='is-flex'>
          <Icon path={mdiAlphaTBox} />
          {#if innerWidth > 570}
            asks
          {/if}
        </Tab>
      </div>
    </Tabs>

    <TextField
      outlined
      dense
      class='maxmins-w-250'
      bind:value={searchFor}
    >
      <div slot='append'>
        <Icon path={mdiMagnify} />
      </div>
      Search
    </TextField>
  </div>

  <Window value={currentWindow} class='overflow-visible'>
    <style>
      .overflow-visible {
        overflow: visible;
      }
    </style>
    <!-- subjects -->
    <WindowItem style='border-top: 1px solid rgba(0, 0, 0, 0.3)' class='p-3'>
      <div class='maxmins-w-100p'>
        <div style='border-bottom: 1px solid rgba(0, 0, 0, 0.3)' class='maxmins-w-100p pb-2 mb-2 is-flex is-align-items-center is-flex-wrap-wrap'>
          <div on:mouseenter={() => hintText.set('Check or uncheck if it is created or not')} class='mr-6'>
            <Checkbox bind:checked={subjectCreated}>
              Created
            </Checkbox>
          </div>
          <div on:mouseenter={() => hintText.set('Check or uncheck if you are joined or not')} class='mr-6'>
            <Checkbox bind:checked={subjectJoined}>
              Joined
            </Checkbox>
          </div>
          <div on:mouseenter={() => hintText.set('Click on the sort by button for Ascending o Descending')} class='mr-6 {innerWidth < 571 ? 'mt-3 flex-grow-1' : ''}'>
            <Select dense outlined items={subjectSort} mandatory bind:value={currentSubjectSort}>
              Sort by
            </Select>
          </div>
        </div>
        <div class='columns is-mobile is-multiline {innerWidth < 571 ? 'is-centered pt-4' : ''}'>
          {#if clientSubjects.length == 0}
            <NothingFound />
          {:else}
            {#each clientSubjects as subject}
              <div class='column is-narrow {innerWidth < 571 ? 'py-0' : ''}'>
                <SubjectBox {data} {subject} />
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </WindowItem>

    <!-- workspaces -->
    <WindowItem style='border-top: 1px solid rgba(0, 0, 0, 0.3)' class='p-2'>
      <div class='maxmins-w-100p'>
        <div style='border-bottom: 1px solid rgba(0, 0, 0, 0.3)' class='maxmins-w-100p pb-2 mb-2 is-flex is-align-items-center is-flex-wrap-wrap'>
          <div class='mr-6'>
            <Checkbox bind:checked={workspaceCreated}>
              Created
            </Checkbox>
          </div>
          <div class='mr-6'>
            <Checkbox bind:checked={workspaceJoined}>
              Joined
            </Checkbox>
          </div>
          <div class='mr-6 {innerWidth < 571 ? 'mt-3 flex-grow-1' : ''}'>
            <Select dense outlined items={workspaceSort} mandatory bind:value={currentWorkspaceSort}>
              Sort by
            </Select>
          </div>
        </div>
        <div class='columns is-mobile is-multiline {innerWidth < 571 ? 'is-centered pt-4' : ''}'>
          {#if clientWorkspaces.length == 0}
            <NothingFound />
          {:else}
            {#each clientWorkspaces as workspace}
              <div class='column is-narrow {innerWidth < 571 ? 'py-0' : ''}'>
                <WorkspaceBox data={{user: data.user, subject: data.subjects.filter(s => s.workspaces.some(w => w === workspace.id))[0]}} {workspace} />
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </WindowItem>

    <!-- tasks -->
    <WindowItem style='border-top: 1px solid rgba(0, 0, 0, 0.3)' class='p-2'>
      <div class='maxmins-w-100p'>
        <div style='border-bottom: 1px solid rgba(0, 0, 0, 0.3)' class='maxmins-w-100p pb-2 mb-2 is-flex is-align-items-center is-flex-wrap-wrap'>
          <div on:mouseenter={() => hintText.set('Check on the high filter to view high priority boards')} class='mr-{innerWidth < 571 ? '3 mb-2' : '6'}'>
            <Checkbox bind:checked={taskHigh}>
              High
            </Checkbox>
          </div>
          <div on:mouseenter={() => hintText.set('Check on the medium filter to view medium priority board')} class='mr-{innerWidth < 571 ? '3 mb-2' : '6'}'>
            <Checkbox bind:checked={taskMedium}>
              Medium
            </Checkbox>
          </div>
          <div on:mouseenter={() => hintText.set('Check on the low filter to view low priority boards')} class='mr-{innerWidth < 571 ? '3 mb-2' : '6'}'>
            <Checkbox bind:checked={taskLow}>
              Low
            </Checkbox>
          </div>
          <div on:mouseenter={() => hintText.set('Click on sort by to change the sorting style')} class='mr-{innerWidth < 571 ? '3' : '6'} {innerWidth < 571 ? 'mt-3 maxmins-w-100p' : ''}'>
            <Select dense outlined items={taskSort} mandatory bind:value={currentTaskSort}>
              Sort by
            </Select>
          </div>
        </div>
        <div class='columns is-mobile is-multiline {innerWidth < 571 ? 'is-centered pt-4' : ''}'>
          {#if clientTasks.length == 0}
            <NothingFound />
          {:else}
            {#each clientTasks as task}
              <div on:mouseenter={() => hintText.set('Click on a board to view the board details')}  class='column is-narrow {innerWidth < 571 ? 'py-0' : ''}'>
                <div on:contextmenu={() => handleRightClick(task)}>
                  <TaskCard {task} data={
                      {
                        taskMembers,
                        workspace: data.workspaces.filter(workspace => workspace.boards.includes(task.status))[0],
                        user: data.user,
                        subject: data.subjects.filter(subject => subject.workspaces.includes(data.workspaces.filter(workspace => workspace.boards.includes(task.status))[0].id))[0]
                      }
                    }
                  />
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </WindowItem>
  </Window>
</div>