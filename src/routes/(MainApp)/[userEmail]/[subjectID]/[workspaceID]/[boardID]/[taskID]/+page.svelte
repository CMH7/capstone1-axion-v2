<script>
  //@ts-nocheck
  /** @type {import('./$types').PageServerData}*/
  export let data
</script>

<div>
  {#each Object.keys(data.task) as prop}
    <div>
      {prop} = {data.task[prop]}
    </div>
  {/each}
</div>
<hr>
Members
<div>
  {#each data.task.members as memberID}
    <a href="{data.task.id}/{memberID}" class="button">
      {memberID}
    </a>
  {/each}
</div>
<hr>
Subtasks
<div>
  {#each data.task.subtasks as subtaskID}
    <a href="{data.task.id}/{subtaskID}" class="button">
      {subtaskID}
    </a>
  {/each}
</div>