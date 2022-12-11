<script>
  // @ts-nocheck
	import TaskCard from '$lib/components/task/task-card.svelte';
	import helpers from '$lib/configs/helpers';
	import models from '$lib/models';
	import { activeBoard } from '$lib/stores/boards.store';
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems, currentIndex, global_USERID, loadingScreen } from '$lib/stores/global.store';
	import { activeTask } from '$lib/stores/task.store';
  import { onMount } from 'svelte';


  //@ts-nocheck
  /** @type {import('./$types').PageServerData}*/
  export let data

  onMount(() => {
    currentIndex.set(0)
    activeSubject.set(data.subject)
    activeWorkspace.set(data.workspace)
    activeBoard.set(data.board)
    activeTask.set(models.task)
    $breadCrumbsItems = [
      {text: data.subject.name, href: `/${data.user.email}`},
      {text: data.workspace.name, href: `/${data.user.email}/${data.subject.id}`},
      {text: data.board.name, href: `/${data.user.email}/${data.subject.id}/${data.workspace.id}`},
      {text: 'view', href: '#'}
    ]
    loadingScreen.set(false)
    global_USERID.set(data.user.id)
    helpers.resetPanels()
  })
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
  {#each data.tasks as task}
    <TaskCard {data} {task} />
  {/each}
</div>