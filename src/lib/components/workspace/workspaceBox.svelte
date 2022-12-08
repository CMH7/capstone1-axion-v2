<script>
  //@ts-nocheck
	import models from '$lib/models';
	import { activeSubject } from '$lib/stores/dashboard.store';
  import { fade } from 'svelte/transition'
  import { Button, Icon } from 'svelte-materialify'
  import { Moon } from 'svelte-loading-spinners'
  import { mdiStar, mdiStarOutline } from '@mdi/js'
	import { newWorkspaceName, selectedWorkspace, workspaceSettingsPanelActive } from '$lib/stores/workspace.store';
	import { loadingScreen, modalChosenColor, notifs } from '$lib/stores/global.store';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { addSubjectPanelActive, subjectSettingsPanelActive } from '$lib/stores/subject.store';

  export let data
  export let workspace = models.workspace

  let innerWidth = 0
  let mouseEnter = false
  let favHovering = false
  let currentWorkspace = ''
  let processing = ''
  let timer
  let hold = 0
  $: mode = data.user.favorites[1].ids.includes(workspace.id) ? 'unset' : 'set'


  /**
   * @param {string} id
   * @param {boolean} ent
   */
  const hoveringWorkspace = (id, ent) => {
    if(ent) {
      currentWorkspace = id
      mouseEnter = true
    }else {
      currentWorkspace = ''
      mouseEnter = false
    }
  }

  /**
   * @param {string} id
   * @param {boolean} ent
   */
  const hoveringFav = (id, ent) => {
    if(ent) {
      currentWorkspace = id
      favHovering = true
    }else{
      currentWorkspace = ''
      favHovering = false
    }
  }

  const handleRightClick = () => {
    workspaceSettingsPanelActive.set(true)
    selectedWorkspace.set(workspace)
    modalChosenColor.set(workspace.color)
    newWorkspaceName.set(workspace.name)
    subjectSettingsPanelActive.set(false)
  }

  const startTimer = () => {
    timer = setInterval(() => {
      if(hold >= 2) {
        handleRightClick()
        clearInterval(timer)
        hold = 0
      }
      hold += 1
    }, 150)
  }

  const touchStart = () => {
    if(favHovering) return
    startTimer()
  }

  const touchEnd = () => {
    if(favHovering) return
    if(hold < 2) {
      hold = 0
      clearInterval(timer)
    }
  }

  const setFavorite = async () => {
    processing = workspace.id
    let form = document.getElementById(workspace.id)
    const data = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    if(result.type === 'invalid') {
      $notifs = [...$notifs, {
        msg: result.data.message,
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      if(mode === 'set') {
        $notifs = [...$notifs, {
          msg: 'Added to favorites',
          type: 'success',
          id: `${(Math.random() * 999) + 1}`
        }]
      }else{
        $notifs = [...$notifs, {
          msg: 'Removed in favorites',
          type: 'success',
          id: `${(Math.random() * 999) + 1}`
        }]
      }
      await invalidateAll();
    }

    applyAction(result);
    processing = ''
    if(innerWidth < 769) {
      currentWorkspace = ''
      favHovering = false
    }
  }

</script>

<svelte:window bind:innerWidth />

<form id='{workspace.id}' action="?/updateFavoriteWorkspaces" class='is-hidden' use:enhance>
  <input type="text" bind:value={workspace.id} name='id'>
  <input type="text" bind:value={mode} name='mode'>
</form>

<div in:fade class="maxmins-w-{innerWidth < 571 && innerWidth >= 473 ? '200' : '230'} flex-shrink-0 mr-3 mb-3">
  <!-- WORKSPACE BOX -->
  <a
    data-sveltekit-preload-data="hover"
    data-sveltekit-preload-code='eager'
    on:click={() => {
      if(!favHovering) loadingScreen.set(true)
    }}
    href="{favHovering ? '#' : `${$activeSubject.id}/${workspace.id}`}"
    class="{workspace.color === ' pink lighten-3' || workspace.color === 'black' || workspace.color === 'grey-light' || workspace.color === 'grey-lighter' ? 'has-text-grey-dark' : workspace.color === ' purple lighten-1' || workspace.color === 'grey' ? 'has-text-white' :  ''}"
  >
    <div
      on:mouseenter={() => hoveringWorkspace(workspace.id, true)}
      on:mouseleave={() => hoveringWorkspace('', false)}
      on:touchstart={touchStart}
      on:touchend={touchEnd}
      on:contextmenu|preventDefault={handleRightClick}
      class="has-transition notification rounded maxmins-h-110 is-relative elevation-1 {mouseEnter && currentWorkspace === workspace.id ?`has-background-${$selectedWorkspace.id === workspace.id && $workspaceSettingsPanelActive ? $modalChosenColor : workspace.color}-dark`:""} is-{$selectedWorkspace.id === workspace.id && $workspaceSettingsPanelActive ? $modalChosenColor : workspace.color} {$selectedWorkspace.id === workspace.id && $workspaceSettingsPanelActive ? $modalChosenColor : workspace.color === 'grey' ? `has-background-${$selectedWorkspace.id === workspace.id && $workspaceSettingsPanelActive ? $modalChosenColor : workspace.color}` : ''} is-clickable maxmins-w-{innerWidth < 571 && innerWidth >= 473 ? '200' : '230'}"
    >
      <div
        on:mouseenter={e => hoveringFav(workspace.id, true)}
        on:mouseleave={e => hoveringFav('', false)}
        class="pos-abs pos-r-0 pos-t-0"
      >
        <Button
          icon
          on:click={setFavorite}
        >
          {#if processing !== workspace.id}
            {#if data.user.favorites[1].ids.includes(workspace.id)}
            <Icon class='has-text-{workspace.color === 'warning' ? '' : 'warning'}' path={favHovering && currentWorkspace === workspace.id ? mdiStarOutline : mdiStar} />
            {:else}
            <Icon class='has-text-{workspace.color === 'warning' ? '' : 'warning'}' path={favHovering && currentWorkspace === workspace.id ? mdiStar : mdiStarOutline} />
            {/if}
          {:else}
            <Moon size={20} color='{workspace.color === ' pink lighten-3' || workspace.color === 'grey-light' || workspace.color === 'grey-lighter' ? '#000' : workspace.color === ' purple lighten-1' || workspace.color === 'grey' || workspace.color === 'black' ? '#fff' :  '#fff'}' />
          {/if}
        </Button>
      </div>

      <!-- workspace name -->
      <p class="is-unselectable txt-size-14 pos-abs pos-r-10 pos-b-10 max-w-{innerWidth < 571 && innerWidth > 473 ? '180' : '200'} txt-overflow-ellipsis overflow-x-hidden mb-0">
        {#if $selectedWorkspace.id === workspace.id && $workspaceSettingsPanelActive}
          {$newWorkspaceName}
        {:else}
          {workspace.name}
        {/if}
      </p>
    </div>
  </a>
</div>