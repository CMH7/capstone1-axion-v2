<script>
  //@ts-nocheck
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems, currentIndex, global_USERID, hintText, loadingScreen, notifs } from '$lib/stores/global.store';
	import { onMount } from 'svelte'
	import BoardMobile from '$lib/components/board/board-mobile.svelte';
	import BoardDesktop from '$lib/components/board/board-desktop.svelte';
	import { newTaskMembers, newTaskStatus, statuses, workspaceMembers } from '$lib/stores/task.store';
	import helpers from '$lib/configs/helpers';
	import bcryptjs from 'bcryptjs';
	import { goto } from '$app/navigation';
	import { Checkbox, Icon, Select, TextField } from 'svelte-materialify';
	import { mdiMagnify } from '@mdi/js';
	import WorkspaceLeaveModal from '$lib/components/workspace/workspaceLeaveModal.svelte';

  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth = 0
  let searchFor = ''
  let cH = true
  let cM = true
  let cL = true
  let boardTasks = []
  let currentTaskSort = 3
  let taskSort = [
    {name: 'A-Z', value: 1},
    {name: 'Z-A', value: 2},
    {name: 'High-Low', value: 3},
    {name: 'Low-High', value: 4},
    {name: 'Upcoming-Overdue', value: 5},
    {name: 'Overdue-Upcoming', value: 6},
  ]

  $: update(data)
  $: update = (/** @type {import('./$types').PageServerData}*/ data) => {
    boardTasks = data.boardTasks.map(bt => {
      return {
        boardID: bt.boardID,
        bTasks: []
      }
    })

    if(cH) {
      boardTasks.forEach(bt1 => {
        bt1.bTasks = [
          ...bt1.bTasks,
          ...data.boardTasks.filter(bt2 => bt2.boardID === bt1.boardID)[0].bTasks.filter(task => task.level == 3).filter(task => {
            if(bt1.bTasks.filter(btask => btask.id === task.id).length == 0) {
              return true
            }else{
              return false
            }
          })
        ]
      })
    } else {
      boardTasks.forEach(bt => {
        bt.bTasks = bt.bTasks.filter(task => task.level != 3)
      })
    }
    
    if(cM) {
      boardTasks.forEach(bt1 => {
        bt1.bTasks = [
          ...bt1.bTasks,
          ...data.boardTasks.filter(bt2 => bt2.boardID === bt1.boardID)[0].bTasks.filter(task => task.level == 2).filter(task => {
            if(bt1.bTasks.filter(btask => btask.id === task.id).length == 0) {
              return true
            }else{
              return false
            }
          })
        ]
      })
    } else {
      boardTasks.forEach(bt => {
        bt.bTasks = bt.bTasks.filter(task => task.level != 2)
      })
    }
    
    if(cL) {
      boardTasks.forEach(bt1 => {
        const res = data.boardTasks.filter(bt2 => bt2.boardID === bt1.boardID)[0].bTasks.filter(task => task.level == 1).filter(task => {
            if(bt1.bTasks.filter(btask => btask.id === task.id).length == 0) {
              return true
            }else{
              return false
            }
          })
        bt1.bTasks = [
          ...bt1.bTasks,
          ...res
        ]
      })
    } else {
      boardTasks.forEach(bt => {
        bt.bTasks = bt.bTasks.filter(task => task.level != 1)
      })
    }

    if(searchFor !== '') {
      boardTasks = boardTasks.map(bt => {
        return {
          boardID: bt.boardID,
          bTasks: bt.bTasks.filter(t => `${searchFor.length >= 3 ? t.id.substring(21, ) : ''}${t.name}`.toLowerCase().match(searchFor.toLowerCase()))
        }
      })
    }

    if(currentTaskSort == 1) {
      boardTasks = boardTasks.map(bt => {
        return {
          boardID: bt.boardID,
          bTasks: bt.bTasks.sort((a,b) => {
            if(a.name > b.name) return 1
            if(a.name < b.name) return -1
            return 0
          })
        }
      })
    }

    if(currentTaskSort == 2) {
      boardTasks = boardTasks.map(bt => {
        return {
          boardID: bt.boardID,
          bTasks: bt.bTasks.sort((a,b) => {
            if(a.name < b.name) return 1
            if(a.name > b.name) return -1
            return 0
          })
        }
      })
    }
    
    if(currentTaskSort == 3) {
      boardTasks = boardTasks.map(bt => {
        return {
          boardID: bt.boardID,
          bTasks: bt.bTasks.sort((a,b) => {
            if(a.level < b.level) return 1
            if(a.level > b.level) return -1
            return 0
          })
        }
      })
    }
    
    if(currentTaskSort == 4) {
      boardTasks = boardTasks.map(bt => {
        return {
          boardID: bt.boardID,
          bTasks: bt.bTasks.sort((a,b) => {
            if(a.level > b.level) return 1
            if(a.level < b.level) return -1
            return 0
          })
        }
      })
    }
    
    if(currentTaskSort == 5) {
        boardTasks = boardTasks.map(bt => {
        return {
          boardID: bt.boardID,
          bTasks: bt.bTasks.sort((a,b) => {
            if(a.dueDateTime < b.dueDateTime) return 1
            if(a.dueDateTime > b.dueDateTime) return -1
            return 0
          })
        }
      })
    }
    
    if(currentTaskSort == 6) {
        boardTasks = boardTasks.map(bt => {
        return {
          boardID: bt.boardID,
          bTasks: bt.bTasks.sort((a,b) => {
            if(a.dueDateTime > b.dueDateTime) return 1
            if(a.dueDateTime < b.dueDateTime) return -1
            return 0
          })
        }
      })
    }
  }
  $: activeWorkspace.set(data.workspace)
  $: activeSubject.set(data.subject)
  $: $breadCrumbsItems = [{text: $activeSubject.name, href: `/${data.user.email}/`}, {text: $activeWorkspace.name, href: `/${data.user.email}/${$activeSubject.id}`}, {text: 'boards', href: '#'}]
  $: workspaceMembers.set(data.workspaceMembers)
  $: global_USERID.set(data.user.id)
  $: statuses.set(data.statuses)
  $: newTaskMembers.set([data.user.id])

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
    currentIndex.set(0)
    hintText.set('Click the \'+\' to create task and more tools!')
    newTaskStatus.set($statuses.filter(status => status.name === 'Todo')[0].value)
    helpers.resetPanels()
    loadingScreen.set(false)
  })

</script>

<svelte:head>
  <title>{$activeWorkspace.name}</title>
</svelte:head>

<svelte:window bind:innerWidth />

<WorkspaceLeaveModal {data} />

<div class="columns is-mobile is-multiline {innerWidth < 571 ? '' : 'pl-3 pt-3'}">
  <div class='column is-12 pt-0 is-mobile is-multiline'>
    <div class='maxmins-w-100p is-flex is-flex-wrap-wrap is-align-items-center {innerWidth < 571 ? 'is-justify-content-center' : ''}'>
      <div class='maxmins-w-{innerWidth < 571 ? '100p' : '400'} mr-{innerWidth < 571 ? '' : '3'}'>
        <TextField
          dense
          outlined
          bind:value={searchFor}
          class='fredoka-reg'
        >
          Search ID, name
          <div slot='append'>
            <Icon path={mdiMagnify} />
          </div>
        </TextField>

      </div>

      <div class='mr-{innerWidth < 571 ? '0' : '3'} {innerWidth < 571 ? 'mt-2 maxmins-w-100p' : ''}'>
        <Select dense outlined bind:items={taskSort} mandatory bind:value={currentTaskSort}>
          Sort by
        </Select>
      </div>

      <div class='fredoka-reg mr-3'>
        Filters:
      </div>

      <div class='mr-3 {innerWidth < 571 ? 'mt-2' : ''}'>
        <Checkbox bind:checked={cH}>
          High
        </Checkbox>
      </div>
      
      <div class='mr-3 {innerWidth < 571 ? 'mt-2' : ''}'>
        <Checkbox bind:checked={cM}>
          Medium
        </Checkbox>
      </div>
      
      <div class='mr-3 {innerWidth < 571 ? 'mt-2' : ''}'>
        <Checkbox bind:checked={cL}>
          Low
        </Checkbox>
      </div>
    </div>
  </div>

  {#if innerWidth < 571}
    <BoardMobile data={
      {
        workspace: data.workspace,
        user: data.user,
        boards: data.boards,
        subject: data.subject,
        boardTasks,
        taskMembers: data.taskMembers,
        statuses: data.statuses,
        workspaceMembers: data.workspaceMembers
      }
    } />
  {:else}
    <BoardDesktop data={
      {
        workspace: data.workspace,
        user: data.user,
        boards: data.boards,
        subject: data.subject,
        boardTasks,
        taskMembers: data.taskMembers,
        statuses: data.statuses,
        workspaceMembers: data.workspaceMembers
      }
    } />
  {/if}
</div>