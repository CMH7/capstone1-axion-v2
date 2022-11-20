<script>
  //@ts-nocheck
  /** @type {import('./$types').PageServerData}*/
  export let data
</script>

<div>
  {#each Object.keys(data.board) as prop}
    <div>
      {prop} = {data.board[prop]}
    </div>
  {/each}
</div>
<hr>
Tasks
<div>
  {#each data.board.tasks as taskID}
    <a href="{data.board.id}/{taskID}" class="button">
      {taskID}
    </a>
  {/each}
</div>