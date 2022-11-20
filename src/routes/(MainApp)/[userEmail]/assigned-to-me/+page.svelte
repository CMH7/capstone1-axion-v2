<script>
  //@ts-nocheck
  /** @type {import('./$types').PageServerData}*/
  export let data
</script>

<div>
  {#each data.tasks as task}
    <div>
      {#each Object.keys(task) as prop}
        <div>
          {prop} = {task[prop]}
        </div>
      {/each}
    </div>
    <hr>
  {/each}
</div>