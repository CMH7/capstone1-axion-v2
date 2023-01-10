<script>
  //@ts-nocheck
	import { addBoardPanelActive, boardSettingsPanelActive, newBoardName, selectedBoard } from '$lib/stores/boards.store';
	import { hintText, modalChosenColor } from '$lib/stores/global.store'
	import { newTaskDueDateTime, newTaskLevel, newTaskName, newTaskStatus, taskSettingsPanelActive } from '$lib/stores/task.store';

  /** @type {import('@prisma/client').boards}*/
  export let board
  export let data

  const setHint = () => {
    hintText.set('Click the board name to access the board status settings')
  }

  const boardClicked = () => {
    if(board.name === 'Todo' || board.name === 'In progress' || board.name === 'Done') return false
    taskSettingsPanelActive.set(false)
    addBoardPanelActive.set(false)
    newTaskName.set('')
    newTaskLevel.set(1)
    newTaskStatus.set('')
    newTaskDueDateTime.set(new Date())
    selectedBoard.set(board)
    newBoardName.set(board.name)
    modalChosenColor.set(board.color)
    boardSettingsPanelActive.set(true)
  }
</script>

<div
  on:mouseenter={setHint}
  class="column is-narrow">
  <div class="is-flex is-justify-content-center">
    <div class="notification pb-1 pt-2 maxmins-w-250 max-h-550 px-2 rounded elevation-3 has-background-{board.color}-light">
      <!-- board header -->
      <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between mb-3">
        <!-- Board Title -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          on:click={boardClicked}
          class="fredoka-reg is-unselectable {board.name === 'Todo' || board.name === 'In progress' || board.name === 'Done' ? '': 'is-clickable'} notification m-0 py-1 px-2 is-{board.color} txt-size-14"
        >
          {board.name}
        </div>

        <!-- task count -->
        <div class="is-flex is-align-items-center pr-2">
          <!-- Task Count Text -->
          <div class="fredoka-reg txt-size-12 is-unselectable">
            {data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.length} {data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.length > 1 ? "Tasks" : "Task"}
          </div>
        </div>
      </div>

      <div style='overflow-y: auto;' class="max-h-500 maxmins-w-100p rounded is-flex is-flex-direction-column is-align-items-center">
        <slot/>
      </div>
    </div>
  </div>
</div>