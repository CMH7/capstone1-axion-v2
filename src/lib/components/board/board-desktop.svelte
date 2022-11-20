<script>
  //@ts-nocheck
	import Board from "$lib/components/board/board.svelte";
  import TaskCard from "$lib/components/task/task-card.svelte";

  export let data
</script>
{#each data.boards as board}
  <!-- BOARDS COMPONENT -->
  <Board {board} {data} >
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
  </Board>
{/each}