<script>
  //@ts-nocheck
  /** @type {import('./$types').PageServerData}*/
  export let data
</script>

<div>
  {#each Object.keys(data.subtask) as prop}
    <div>
      {prop} = {data.subtask[prop]}
    </div>
  {/each}
</div>
<hr>
Members
<div>
  {#each data.subtask.members as memberID}
    <a href="{data.subtask.id}/{memberID}" class="button">
      {memberID}
    </a>
  {/each}
</div>
<hr>
Subtasks
<div>
  {#each data.subtask.subtasks as subtaskID}
    <a href="{subtaskID}" class="button">
      {subtaskID}
    </a>
  {/each}
</div>