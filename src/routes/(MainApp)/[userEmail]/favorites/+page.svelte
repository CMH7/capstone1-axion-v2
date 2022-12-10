<script>
  //@ts-nocheck
	import { breadCrumbsItems, currentIndex, loadingScreen } from '$lib/stores/global.store';
	import { onMount } from 'svelte';

  /**
   * @type {import('./$types').PageServerData}
   * */
  export let data

  onMount(() => {
    currentIndex.set(2)
    $breadCrumbsItems = [{text: 'Favorites', href: '#'}]
    loadingScreen.set(false)
  })
</script>

<div>
  <div>
    Subjects
  </div>
  {#each data.subjects as subject}
    <div>
      {#each Object.keys(subject) as prop}
        <div>
          {prop} = {subject[prop]}
        </div>
      {/each}
    </div>
  {/each}
  <hr>
  <div>
    Workspaces
  </div>
  {#each data.workspaces as workspace}
    {#each Object.keys(workspace) as prop}
        <div>
          {prop} = {workspace[prop]}
        </div>
      {/each}
  {/each}
  <hr>
  <div>
    Tasks
  </div>
  {#each data.tasks as task}
    {#each Object.keys(task) as prop}
        <div>
          {prop} = {task[prop]}
        </div>
      {/each}
  {/each}
  <hr>
</div>