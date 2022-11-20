<script>
  //@ts-nocheck
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems } from '$lib/stores/global.store';
	import { onMount } from 'svelte'
	import BoardMobile from '$lib/components/board/board-mobile.svelte';
	import BoardDesktop from '$lib/components/board/board-desktop.svelte';

  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth = 0

  onMount(() => {
    activeSubject.set(data.subject)
    activeWorkspace.set(data.workspace)
    $breadCrumbsItems = [{text: $activeSubject.name, href: `/${data.user.email}/`}, {text: $activeWorkspace.name, href: `/${data.user.email}/${$activeSubject.id}`}, {text: 'boards', href: '#'}]
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