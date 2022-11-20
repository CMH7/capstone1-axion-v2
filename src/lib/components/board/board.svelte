<script>
  //@ts-nocheck
	import { boardSettingsModalActive, selectedBoard, showFilter } from '$lib/stores/boards.store';
	import { modalChosenColor } from '$lib/stores/global.store';
  import { Button, Icon } from 'svelte-materialify'
  import { fade } from 'svelte/transition'
  import TaskFilterDropdown from '$lib/components/taskFilterDropdown.svelte';
  import { mdiFilter } from '@mdi/js'

  /** @type {import('@prisma/client').boards}*/
  export let board
  export let data

  /** 
   * @param {string} filterMode
   * @param {import('@prisma/client').tasks[]} tasks
   * 
   * @return {import('@prisma/client').tasks[]} sorted_or_filtered_tasks
  */
  const filterTasks = (filterMode, tasks) => {
    if(filterMode === 'A1') {
      return tasks.sort((a, b) => {
        if(a.name.toLowerCase() > b.name.toLowerCase()) return 1
        if(a.name.toLowerCase() < b.name.toLowerCase()) return -1
        return 0
      })
    }
    
    if(filterMode === 'A2') {
      return tasks.sort((a, b) => {
        if(a.name.toLowerCase() < b.name.toLowerCase()) return 1
        if(a.name.toLowerCase() > b.name.toLowerCase()) return -1
        return 0
      })
    }

    if( filterMode === 'A3') {
      return tasks.sort((a, b) => {
        if(a.level < b.level) return 1
        if(a.level > b.level) return -1
        return 0
      })
    }
    
    if( filterMode === 'A4') {
      return tasks.sort((a, b) => {
        if(a.level > b.level) return 1
        if(a.level < b.level) return -1
        return 0
      })
    }

    if( filterMode === 'A5') {
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
    
    if( filterMode === 'A6') {
      return tasks.sort((a, b) => {
        if((new Date(a.dueDateTime).getTime() - new Date().getTime()) < (new Date(b.dueDateTime).getTime() - new Date().getTime())) return 1
        if((new Date(a.dueDateTime).getTime() - new Date().getTime()) > (new Date(b.dueDateTime).getTime() - new Date().getTime())) return -1
        return 0
      })
    }
    
    if( filterMode === 'B1') {
      return tasks.filter(task => task.level == 3)
    }

    if( filterMode === 'B2') {
      return tasks.filter(task => task.level == 2)
    }

    if( filterMode === 'B3') {
      return tasks.filter(task => task.level == 1)
    }
  }

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

</script>

<div class="column is-narrow">
  <div class="is-flex is-justify-content-center">
    <div class="notification pb-1 pt-2 maxmins-w-250 max-h-550 px-2 rounded elevation-3 has-background-{board.color}-light">
      <!-- board header -->
      <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between mb-3">
        <!-- Board Title -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          on:click={e => {
            if(board.name === 'Todo' || board.name === 'In progress' || board.name === 'Done') return false
            selectedBoard.set(board)
            modalChosenColor.set(board.color)
            boardSettingsModalActive.set(true)
          }}
          class="fredoka-reg is-unselectable {board.name === 'Todo' || board.name === 'In progress' || board.name === 'Done' ? '': 'is-clickable'} notification m-0 py-1 px-2 is-{board.color} txt-size-14"
        >
          {board.name}
        </div>

        <!-- task count and filter button -->
        <div class="is-flex is-align-items-center is-relative">

          <!-- Task Count Text -->
          <div class="fredoka-reg txt-size-12 is-unselectable">
            {data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.filter(taska => taska.isSubtask == false).length} {data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.filter(taska => taska.isSubtask == false).length > 1 ? "Tasks" : "Task"}
          </div>

          <!-- filter icon -->
          <Button
            icon
            on:click={() => {
              if(data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.filter(taska => taska.isSubtask == false).length == 0) return
              showFilter.set(true)
              selectedBoard.set(board)
            }}
            class="ml-1 is-flex is-justify-content-center is-align-items-center has-transition"
          >
            <Icon size='18px' path={mdiFilter} />
          </Button>

          <!-- filter selection -->
          <TaskFilterDropdown {board} />

        </div>
      </div>

      <div style='overflow-y: auto;' class="max-h-500 maxmins-w-100p rounded is-flex is-flex-direction-column is-align-items-center">
        <slot/>
      </div>
    </div>
  </div>
</div>