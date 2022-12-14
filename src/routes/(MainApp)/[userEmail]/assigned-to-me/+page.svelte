<script>
  //@ts-nocheck
	import { goto } from '$app/navigation';
	import NothingFound from '$lib/components/nothingFound.svelte';
	import TaskCard from '$lib/components/task/task-card.svelte';
	import helpers from '$lib/configs/helpers'
	import { addBoardPanelActive, boardSettingsPanelActive, newBoardName, selectedBoard } from '$lib/stores/boards.store';
	import { activeWorkspace } from '$lib/stores/dashboard.store';
  import { breadCrumbsItems, currentIndex, global_USERID, hintText, loadingScreen, modalChosenColor, notifs } from '$lib/stores/global.store';
	import { newTaskDueDateTime, newTaskLevel, newTaskName, newTaskStatus, statuses, taskSettingsPanelActive } from '$lib/stores/task.store';
	import { mdiFilter, mdiTune } from '@mdi/js';
	import bcryptjs from 'bcryptjs';
	import { onMount } from 'svelte';
	import { Button, ExpansionPanel, ExpansionPanels, Icon } from 'svelte-materialify';

  /**
   * @type {import('./$types').PageServerData}
   * */
  export let data

  /**
   * @type {
   * {
        id: string[];
        color: string;
        name: string;
        tasks: {
          id: string,
          name: string,
          level: number,
          members: string[],
          subtasks: string[],
          dueDateTime: Date,
          status: string,
        }[]
      }[]
    }
   */
  let boardTaskss = []
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
  let innerWidth = 0
  let hide = false
  //@ts-ignore
  let valueExp = []
  
  $: updates(data)

  const setHint = () => {
    hintText.set('Click the board name for the board settings (for custom boards only)')
  }

  //@ts-ignore
  const boardClicked = (board) => {
    if(board.name === 'Todo' || board.name === 'In progress' || board.name === 'Done' || board.id.length != 1) return false
    statuses.set(workspaceStatuses.filter(ws => ws.statuses.some(y => y.value === board.id[0]))[0].statuses)
    let ws = workspaceStatuses.filter(ws => ws.statuses.some(y => y.value === board.id[0]))[0]
    activeWorkspace.set(
      {
          id: ws.workspaceID,
          admins: [''],
          boards: [''],
          color: '',
          members: [''],
          name: '',
          owner: '',
      }
    )
    taskSettingsPanelActive.set(false)
    addBoardPanelActive.set(false)
    newTaskName.set('')
    newTaskLevel.set(1)
    newTaskStatus.set('')
    newTaskDueDateTime.set(new Date())
    selectedBoard.set({
      color: board.color,
      filter: 'a1',
      id: board.id[0],
      name: board.name,
      tasks: board.tasks
    })
    newBoardName.set(board.name)
    modalChosenColor.set(board.color)
    boardSettingsPanelActive.set(true)
  }

  /**
   * @param {import('./$types').PageServerData} data
   */
  const updates = (data) => {
    boardTaskss = []
    taskMembers = []
    workspaceStatuses = []

    data.boards.forEach(board => {
      if(boardTaskss.filter(bt => bt.name === board.name).length == 0) {
        boardTaskss = [
          ...boardTaskss,
          {
            id: [board.id],
            color: board.color,
            name: board.name,
            tasks: []
          }
        ]
      }else{
        boardTaskss.every(bt => {
          if(bt.name === board.name) {
            bt.id = [
              ...bt.id,
              board.id
            ]
            return false
          }
          return true
        })
      }
    })
    data.tasks.forEach(task => {
      boardTaskss.every(bt => {
        if(bt.id.includes(task.status)) {
          bt.tasks = [
            ...bt.tasks,
            task
          ]
          return false
        }
        return true
      })
    })

    data.tasks.forEach((task) => {
      taskMembers = [...taskMembers, { taskID: task.id, members: [] }];
    });

    data.allMembers.forEach((member) => {
      data.tasks.forEach((task) => {
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
          statuses: data.allStatusesAssignedToMe.filter(stat => w.boards.includes(stat.value))
        }
      ]
    })
  }

  //@ts-ignore
  const handleRightClick = (task) => {
    //@ts-ignore
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
    currentIndex.set(1)
    $breadCrumbsItems = [{text: 'Assigned to me', href: '#'}]
    loadingScreen.set(false)
    global_USERID.set(data.user.id)
    helpers.resetPanels()
  })
</script>

<svelte:window bind:innerWidth />

<div class="columns is-mobile {innerWidth < 571 ? 'is-multiline' : ''} overflow-x-auto {innerWidth < 571 ? '' : 'pl-3 pt-3'}">
  {#if boardTaskss.length != 0}
    {#if innerWidth > 570}
      <!-- desktop version -->
      {#each boardTaskss as bt}
        <div
          on:mouseenter={setHint}
          class="column is-narrow"
        >
          <div class="is-flex is-justify-content-center">
            <div class="notification pb-1 pt-2 maxmins-w-250 max-h-550 px-2 rounded elevation-1 has-background-{bt.color}-light">
              <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between mb-3">
                <!-- Board Title -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                  on:click={() => boardClicked(bt)}
                  class="fredoka-reg is-unselectable {bt.name === 'Todo' || bt.name === 'In progress' || bt.name === 'Done' ? '': 'is-clickable'} notification m-0 py-1 px-2 is-{bt.color} txt-size-14"
                >
                  {bt.name}
                </div>

                <!-- task count and filter button -->
                <div class="is-flex is-align-items-center is-relative">

                  <!-- Task Count Text -->
                  <div class="fredoka-reg txt-size-12 is-unselectable">
                    {bt.tasks.length}Task{bt.tasks.length > 1 ? 's' : ''}
                  </div>

                  <!-- filter icon -->
                  <!-- <Button
                    icon
                    size='small'
                    on:click={() => {
                      // if(data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.filter(taska => taska.isSubtask == false).length == 0) return
                      // showFilter.set(true)
                      // selectedBoard.set(board)
                    }}
                    class="ml-1 is-flex is-justify-content-center is-align-items-center has-transition"
                  >
                    <Icon class='opacity-0p' size='18px' path={mdiFilter} />
                  </Button> -->

                  <!-- filter selection -->
                  <!-- <TaskFilterDropdown {board} /> -->
                </div>
              </div>
              
              <div style='overflow-y: auto;' class="max-h-500 maxmins-w-100p rounded is-flex is-flex-direction-column is-align-items-center">
                {#each bt.tasks.sort((a, b) => {
                  if(a.level > b.level) return -1
                  if(a.level < b.level) return 1
                  return 0
                }) as task}
                  <div on:contextmenu={() => handleRightClick(task)}>
                    <TaskCard {task} inDone={bt.name === 'Done'} data={
                        {
                          taskMembers,
                          workspace: data.workspaces.filter(workspace => workspace.boards.includes(task.status))[0],
                          user: data.user,
                          subject: data.subjects.filter(subject => subject.workspaces.includes(data.workspaces.filter(workspace => workspace.boards.includes(task.status))[0].id))[0]
                        }
                      }
                    />
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/each}
    {:else}
      <!-- mobile version -->
      <div class="column is-12">
        <ExpansionPanels bind:value={valueExp} style='z-index: 0' popout multiple flat>
          {#each boardTaskss as bt}
            <ExpansionPanel class='has-background-{bt.color}-light mb-2 is-flex is-flex-direction-column is-align-items-center'>
              <span
                class="is-flex is-align-items-center is-justify-content-space-between maxmins-w-100p pr-3"
                slot="header"
              >
                <div class="fredoka-reg has-background-{bt.color} txt-size-11 px-3 py-2 rounded has-text-white">
                  {bt.name}
                </div>
        
                <div class="txt-size-11 fredoka-reg">
                  {bt.tasks.length} Task{bt.tasks.length > 1 ? "s" : ""}
                </div>
              </span>

              <div class="max-h-550 is-flex is-flex-direction-column is-align-items-center mt-3 pos-rel">
                <div class="is-flex is-align-items-center is-justify-content-space-between maxmins-w-100p">
                  {#if bt.name === 'Todo' || bt.name === 'In progress' || bt.name === 'Done'}
                    <div/>
                  {:else}
                    {#if bt.id.length == 1}
                      <Button
                        on:click={() => boardClicked(bt)}
                        depressed
                        size='x-small'
                        class='p-4 has-background-white fredoka-reg is-flex is-align-items-center'
                      >
                        <Icon size='15px' path={mdiTune} class='mr-3' />
                        Settings
                      </Button>
                    {:else}
                      <div />
                    {/if}
                  {/if}
                  
                  <div />
                </div>

                <div class="max-h-550 is-flex is-flex-direction-column is-align-items-center mt-6 overflow-y-auto">
                  {#each bt.tasks.sort((a, b) => {
                    if(a.level > b.level) return -1
                    if(a.level < b.level) return 1
                    return 0
                  }) as task}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div on:click={() => valueExp = []} on:contextmenu={() => handleRightClick(task)}>
                      <TaskCard {task} inDone={bt.name === 'Done'} data={
                          {
                            taskMembers,
                            workspace: data.workspaces.filter(workspace => workspace.boards.includes(task.status))[0],
                            user: data.user,
                            subject: data.subjects.filter(subject => subject.workspaces.includes(data.workspaces.filter(workspace => workspace.boards.includes(task.status))[0].id))[0]
                          }
                        }
                      />
                    </div>
                  {/each}
                </div>
              </div>
            </ExpansionPanel>
          {/each}
        </ExpansionPanels>
      </div>
    {/if}
  {:else}
    <NothingFound />
  {/if}
</div>