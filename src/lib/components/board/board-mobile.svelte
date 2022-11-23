<script>
  //@ts-nocheck
	import { boardSettingsModalActive, selectedBoard, showFilter } from '$lib/stores/boards.store';
	import { modalChosenColor } from '$lib/stores/global.store';
  import { mdiTune, mdiMinus, mdiFilter } from '@mdi/js'
  import { ExpansionPanels, ExpansionPanel, Button, Icon, ClickOutside, Divider } from 'svelte-materialify'
	import TaskCard from '../task/task-card.svelte';
	import TaskFilterDropdown from '../taskFilterDropdown.svelte';

  export let data

  const sorts = [
    {
      prop: 'task name',
      sortTo: [
        {
        type: 'A1',
        label: 'A-Z'
        },
        {
        type: 'A2',
        label: 'Z-A'
        }
      ]
    },
    {
      prop: 'task level',
      sortTo: [
        {
        type: 'A3',
        label: 'High-Low'
        },
        {
        type: 'A4',
        label: 'Low-High'
        }
      ]
    },
    {
      prop: 'task due',
      sortTo: [
        {
        type: 'A5',
        label: 'Overdue-before due'
        },
        {
        type: 'A6',
        label: 'before due-Overdue'
        }
      ]
    }
  ]

  /** 
   * @param {string} filterMode
   * @param {import('@prisma/client').tasks[]} tasks
   * 
   * @return {import('@prisma/client').tasks[]} sorted_or_filtered_tasks
  */
  const filterTasks = (filterMode, tasks) => {
    if(filterMode === 'a1') {
      return tasks.sort((a, b) => {
        if(a.name.toLowerCase() > b.name.toLowerCase()) return 1
        if(a.name.toLowerCase() < b.name.toLowerCase()) return -1
        return 0
      })
    }
    
    if(filterMode === 'a2') {
      return tasks.sort((a, b) => {
        if(a.name.toLowerCase() < b.name.toLowerCase()) return 1
        if(a.name.toLowerCase() > b.name.toLowerCase()) return -1
        return 0
      })
    }

    if( filterMode === 'a3') {
      return tasks.sort((a, b) => {
        if(a.level < b.level) return 1
        if(a.level > b.level) return -1
        return 0
      })
    }
    
    if( filterMode === 'a4') {
      return tasks.sort((a, b) => {
        if(a.level > b.level) return 1
        if(a.level < b.level) return -1
        return 0
      })
    }

    if( filterMode === 'a5') {
      /** @type {import('@prisma/client').tasks[]}*/
      let dues = []
      tasks.map(task => {
        let time1 = new Date(task.dueDateTime).getTime()
        let time2 = new Date().getTime()
        let diffDays = (time1 - time2) / (1000 * 3600 * 24)
        dues = [...dues, {id: task.id, diffDays}]
      })
      let dues2 = dues.sort((a,b) => {
        if(a.diffDays > b.diffDays) return 1
        if(a.diffDays < b.diffDays) return -1
        return 0
      })

      let dues3 = dues2.map(due => {
        return tasks.filter(task1 => task1.id === due.id)[0]
      })
      return dues3
    }
    
    if( filterMode === 'a6') {
      return tasks.sort((a, b) => {
        if((new Date(a.dueDateTime).getTime() - new Date().getTime()) < (new Date(b.dueDateTime).getTime() - new Date().getTime())) return 1
        if((new Date(a.dueDateTime).getTime() - new Date().getTime()) > (new Date(b.dueDateTime).getTime() - new Date().getTime())) return -1
        return 0
      })
    }
    
    if( filterMode === 'b1') {
      return tasks.filter(task => task.level == 3)
    }

    if( filterMode === 'b2') {
      return tasks.filter(task => task.level == 2)
    }

    if( filterMode === 'B3') {
      return tasks.filter(task => task.level == 1)
    }
  }

  const changeFilter = () => {
    showFilter.set(false)
    console.log('Changed Filter!');
  }
</script>

<div class="mt-3 column is-12">
  <ExpansionPanels style='z-index: 0' popout multiple flat>
    {#each data.boards as board}
      <ExpansionPanel class='has-background-{board.color}-light mb-2 is-flex is-flex-direction-column is-align-items-center'>
        <span
          class="is-flex is-align-items-center is-justify-content-space-between maxmins-w-100p pr-3"
          slot="header"
        >
          <div class="fredoka-reg has-background-{board.color} txt-size-11 px-3 py-2 rounded has-text-white">
            {board.name}
          </div>
  
          <div class="txt-size-11 fredoka-reg">
            {data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.filter(taska => taska.isSubtask == false).length} {data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.filter(taska => taska.isSubtask == false).length > 1 ? "Tasks" : "Task"}
          </div>
        </span>

        <div class="max-h-550 is-flex is-flex-direction-column is-align-items-center mt-3 pos-rel">
          <div class="is-flex is-align-items-center is-justify-content-space-between maxmins-w-100p">
            {#if board.name === 'Todo' || board.name === 'In progress' || board.name === 'Done'}
              <div/>
            {:else}
              <Button
                on:click={e => {
                if(board.name === 'Todo' || board.name === 'In progress' || board.name === 'Done') return
                  selectedBoard.set(board)
                  modalChosenColor.set(board.color)
                  boardSettingsModalActive.set(true)
                }}
                depressed
                size='x-small'
                class='p-4 has-background-white fredoka-reg is-flex is-align-items-center'
              >
                <Icon size='15px' path={mdiTune} class='mr-3' />
                Settings
              </Button>
            {/if}

            {#if filterTasks(board.filter, data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks).length != 0}
              <Button
                on:click={e => {
                  selectedBoard.set(board)
                  showFilter.set(!$showFilter)
                }}
                depressed
                size='x-small'
                class='p-4 has-background-white fredoka-reg is-flex is-align-items-center'
              >
                <Icon size='15px' path={mdiFilter} class='mr-3' />
                Filter
              </Button>
            {:else}
              <Button depressed size='x-small' class='opacity-0p' >
                <Icon size='15px' path={mdiFilter} class='mr-3' />
                Filter
              </Button>
            {/if}
          </div>

          <TaskFilterDropdown {board} />

          <div class="max-h-550 is-flex is-flex-direction-column is-align-items-center mt-6 overflow-y-auto">
            {#if filterTasks(board.filter, data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks).length == 0}
              <div class="txt-size-11 fredoka-reg">
                There's no task in here
              </div>
            {:else}
              {#each data.boardTasks as bt}
                {#if bt.boardID === board.id}
                  {#each bt.bTasks as task}
                    {#if !task.isSubtask}
                      <!-- TASK CARD COMPONENT -->
                      <TaskCard {task} {data} />
                    {/if}
                  {/each}
                {/if}
              {/each}
            {/if}
          </div>
        </div>
      </ExpansionPanel>
    {/each}
  </ExpansionPanels>
</div>