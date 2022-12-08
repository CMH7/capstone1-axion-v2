<script>
  //@ts-nocheck
	import { breadCrumbsItems, loadingScreen } from '$lib/stores/global.store';
	import { onMount } from 'svelte';

  /**
   * @type {import('./$types').PageServerData}
   * */
  export let data

  onMount(() => {
    $breadCrumbsItems = [{text: 'Assigned to me', href: '#'}]
    loadingScreen.set(false)
  })
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