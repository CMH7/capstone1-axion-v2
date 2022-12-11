<script>
  //@ts-nocheck
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems, currentIndex, global_USERID, hintText, loadingScreen } from '$lib/stores/global.store';
	import { onMount } from 'svelte'
	import BoardMobile from '$lib/components/board/board-mobile.svelte';
	import BoardDesktop from '$lib/components/board/board-desktop.svelte';
	import { newTaskMembers, newTaskStatus, statuses, workspaceMembers } from '$lib/stores/task.store';
	import helpers from '$lib/configs/helpers';

  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth = 0

  onMount(() => {
    currentIndex.set(0)
    activeSubject.set(data.subject)
    activeWorkspace.set(data.workspace)
    $breadCrumbsItems = [{text: $activeSubject.name, href: `/${data.user.email}/`}, {text: $activeWorkspace.name, href: `/${data.user.email}/${$activeSubject.id}`}, {text: 'boards', href: '#'}]
    hintText.set('Click the \'+\' to create task and more tools!')
    global_USERID.set(data.user.id)
    statuses.set(data.statuses)
    newTaskStatus.set($statuses.filter(status => status.name === 'Todo')[0].value)
    newTaskMembers.set([data.user.id])
    workspaceMembers.set(data.workspaceMembers)
    helpers.resetPanels()
    loadingScreen.set(false)
  })

</script>

<svelte:head>
  <title>{$activeWorkspace.name}</title>
</svelte:head>

<svelte:window bind:innerWidth />

<div class="columns is-mobile overflow-x-auto {innerWidth < 571 ? '' : 'pl-3 pt-3'}">
  {#if innerWidth < 571}
    <BoardMobile {data} />
  {:else}
    <BoardDesktop {data} />
  {/if}
</div>