<script>
  // @ts-nocheck
	import { goto } from '$app/navigation';
	import helpers from '$lib/configs/helpers';
	import { breadCrumbsItems, currentIndex, global_USERID, loadingScreen, notifs } from '$lib/stores/global.store';
	import bcryptjs from 'bcryptjs';
	import { onMount } from 'svelte'

  /** @type {import('./$types').PageServerData}*/
  export let data

  onMount(() => {
    if(!bcryptjs.compareSync(localStorage.getItem('xxx'), data.user.password)) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Unauthorized accessing',
          type: 'warn',
          id: (Math.random() * 99) + 1
        }
      ]
      goto('/Signin', {replaceState: true})
      return
    }
    currentIndex.set(4)
    $breadCrumbsItems = [{text: 'Invitations', href: '#'}]
    loadingScreen.set(false)
    global_USERID.set(data.user.id)
    helpers.resetPanels()
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

