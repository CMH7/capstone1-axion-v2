<script>
  //@ts-nocheck
	import Board from "$lib/components/board/board.svelte";
  import TaskCard from "$lib/components/task/task-card.svelte";
  import { addTaskPanelActive, newTaskStatus } from "$lib/stores/task.store";
  import TaskCardPreview from "$lib/components/task/taskCardPreview.svelte";
  import BoardPreview from "$lib/components/board/boardPreview.svelte";
	import { addBoardPanelActive } from "$lib/stores/boards.store";

  export let data

  $: boardTasks = data.boardTasks
</script>
{#each data.boards as board}
  {#if board.name === 'Done' && $addBoardPanelActive}
    <BoardPreview />
  {/if}
  <!-- BOARDS COMPONENT -->
  <Board {board} {data} >
    {#if $addTaskPanelActive && $newTaskStatus === board.id}
      <TaskCardPreview />
    {/if}
    {#each boardTasks as bt}
      {#if bt.boardID === board.id}
        {#each bt.bTasks as task}
          <TaskCard {task} {data} />
        {/each}
      {/if}
    {/each}
  </Board>
{/each}