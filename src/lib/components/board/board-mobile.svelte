<script>
  //@ts-nocheck
	import { addBoardPanelActive, boardSettingsPanelActive, newBoardName, selectedBoard, showFilter } from '$lib/stores/boards.store';
	import { modalChosenColor } from '$lib/stores/global.store';
	import { newTaskDueDateTime, newTaskLevel, newTaskName, newTaskStatus, taskSettingsPanelActive } from '$lib/stores/task.store';
  import { mdiTune, mdiFilter } from '@mdi/js'
  import { ExpansionPanels, ExpansionPanel, Button, Icon } from 'svelte-materialify'
	import TaskCard from '../task/task-card.svelte';
	import TaskFilterDropdown from '../taskFilterDropdown.svelte';

  export let data
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
            {data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.length} {data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.length > 1 ? "Tasks" : "Task"}
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
                }}
                depressed
                size='x-small'
                class='p-4 has-background-white fredoka-reg is-flex is-align-items-center'
              >
                <Icon size='15px' path={mdiTune} class='mr-3' />
                Settings
              </Button>
            {/if}
          </div>

          <div class="max-h-550 is-flex is-flex-direction-column is-align-items-center mt-6 overflow-y-auto">
            {#if data.boardTasks.filter(bt => bt.boardID === board.id)[0].bTasks.length == 0}
              <div class="txt-size-11 fredoka-reg">
                No task
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