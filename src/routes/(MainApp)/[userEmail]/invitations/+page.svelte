<script>
  // @ts-nocheck
	import { breadCrumbsItems, loadingScreen } from '$lib/stores/global.store';
	import { onMount } from 'svelte'

  /** @type {import('./$types').PageServerData}*/
  export let data

  onMount(() => {
    $breadCrumbsItems = [{text: 'Invitations', href: '#'}]
    loadingScreen.set(false)
  })
</script>

<svelte:head>
  <title>My profile</title>
</svelte:head>

<div>
  <div>
    <div>
      {#each Object.keys(data.user) as prop}
        <div class="is-flex is-align-items-center">
          {prop} = {data.user[prop]} | 
          {#if prop === 'subjects'}
            {#each data.user[prop] as subject}
              <a href="/{data.user.email}/{subject}">
                {subject}
              </a>
            {/each}
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<form method="POST" action="?/logout">
  <button class="button">
    Logout
  </button>
</form>

