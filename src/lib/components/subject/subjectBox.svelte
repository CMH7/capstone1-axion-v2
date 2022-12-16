<script>
  //@ts-nocheck
	import models from '$lib/models';
	import { global_USERID, hintText, loadingScreen, modalChosenColor, notifs } from '$lib/stores/global.store';
	import { newSubjectName, selectedSubject, subjectSettingsPanelActive } from '$lib/stores/subject.store';
  import { Button, Icon } from 'svelte-materialify'
  import { mdiStar, mdiStarOutline } from '@mdi/js'
  import { fade } from 'svelte/transition'
	import { applyAction, deserialize, enhance } from '$app/forms';
  import { Moon } from 'svelte-loading-spinners'
	import { invalidateAll } from '$app/navigation';

  export let data
  export let subject = models.subject

  let currentSubject = ''
  let mouseEnter = false
  let favHovering = false
  let innerWidth = 0
  let timer
  let hold = 0
  let processing = ''
  $: mode = data.user.favorites[0].ids.includes(subject.id) ? 'unset' : 'set'

  /**
   * @param {string} id
   * @param {boolean} ent
  */
  const hoveringSubject = (id, ent) => {
    if(ent) {
      currentSubject = id
      mouseEnter = true
    }else{
      currentSubject = ''
      mouseEnter = false
    }
  }

  /**
   * @param {string} id
   * @param {boolean} ent
   */
  const hoveringFav = (id, ent) => {
    if(ent) {
      currentSubject = id
      favHovering = true
    }else{
      currentSubject = ''
      favHovering = false
    }
  }

  const handleRightClick = () => {
    selectedSubject.set(subject)
    modalChosenColor.set(subject.color)
    newSubjectName.set(subject.name)
    subjectSettingsPanelActive.set(true)
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

  const touchStart = e => {
    if(favHovering) return
    startTimer()
  }

  const touchEnd = e => {
    if(favHovering) return
    if(hold < 2) {
      hold = 0
      clearInterval(timer)
    }
  }

  const setFavorite = async () => {
    processing = subject.id
    let form = document.getElementById(subject.id)
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
      currentSubject = ''
      favHovering = false
    }
  }

</script>

<svelte:window bind:innerWidth />

<form id='{subject.id}' action="?/updateFavoriteSubjects" class='is-hidden' use:enhance>
  <input type="text" bind:value={subject.id} name='id'>
  <input type="text" bind:value={mode} name='mode'>
  <input type="text" bind:value={$global_USERID} name='userID'>
</form>

<div in:fade class="maxmins-w-{innerWidth < 571 && innerWidth >= 473 ? '200' : '230'} flex-shrink-0 mr-3 mb-3">
  <!-- SUBJECT BOX -->
  <div on:mouseenter={() => hintText.set('Click a subject to view the workspace, Hold o Right click on a subject to view subject settings')}>
  <a
    data-sveltekit-preload-data="hover"
    data-sveltekit-preload-code='eager'
    on:click={() => {
      if(!favHovering) loadingScreen.set(true)
    }}
    href='{favHovering ? '#' : `/${data.user.email}/${subject.id}`}'
    class='{subject.color === ' pink lighten-3' || subject.color === 'black' || subject.color === 'grey-light' || subject.color === 'grey-lighter' ? 'has-text-grey-dark' : subject.color === ' purple lighten-1' || subject.color === 'grey' ? 'has-text-white' :  ''}'
  >
    <div
      on:mouseenter={() => hoveringSubject(subject.id, true)}
      on:mouseleave={() => hoveringSubject('', false)}
      on:touchstart={touchStart}
      on:touchend={touchEnd}
      on:contextmenu|preventDefault={handleRightClick}
      class="has-transition notification rounded maxmins-h-110 is-relative elevation-1 {mouseEnter && currentSubject === subject.id ?`has-background-${$selectedSubject.id === subject.id && $subjectSettingsPanelActive ? $modalChosenColor : subject.color}-dark`:""} is-{$selectedSubject.id === subject.id && $subjectSettingsPanelActive ? $modalChosenColor : subject.color} {$selectedSubject.id === subject.id && $subjectSettingsPanelActive ? $modalChosenColor : subject.color === 'grey' ? `has-background-${$selectedSubject.id === subject.id && $subjectSettingsPanelActive ? $modalChosenColor : subject.color}` : ''} is-clickable maxmins-w-{innerWidth < 571 && innerWidth >= 473 ? '200' : '230'}"
    >
      <div
        on:mouseenter={() => hintText.set('Click the star icon to pick if this is a favorite or not')}
        on:mouseenter={e => hoveringFav(subject.id, true)}
        on:mouseleave={e => hoveringFav('', false)}
        class="pos-abs pos-r-0 pos-t-0"
      >
        <Button 
          icon
          on:click={setFavorite}
        >
          {#if processing !== subject.id}
            {#if data.user.favorites[0].ids.includes(subject.id)}
              <Icon class='has-text-{$selectedSubject.id === subject.id && $subjectSettingsPanelActive ? $modalChosenColor === 'warning' : subject.color === 'warning' || $selectedSubject.id === subject.id && $subjectSettingsPanelActive ? $modalChosenColor === 'warning' : subject.color === 'grey-light' || $selectedSubject.id === subject.id && $subjectSettingsPanelActive ? $modalChosenColor === 'warning' : subject.color === 'grey-lighter' ? '' : 'warning'}' path={favHovering && currentSubject === subject.id ? mdiStarOutline : mdiStar} />
            {:else}
              <Icon class='has-text-{$selectedSubject.id === subject.id && $subjectSettingsPanelActive ? $modalChosenColor === 'warning' : subject.color === 'warning' || $selectedSubject.id === subject.id && $subjectSettingsPanelActive ? $modalChosenColor : subject.color === 'grey-light' || $selectedSubject.id === subject.id && $subjectSettingsPanelActive ? $modalChosenColor === 'warning' : subject.color === 'grey-lighter' ? '' : 'warning'}' path={favHovering && currentSubject === subject.id ? mdiStar : mdiStarOutline} />
            {/if}
          {:else}
            <Moon size={20} color='{subject.color === ' pink lighten-3' || subject.color === 'grey-light' || subject.color === 'grey-lighter' ? '#000' : subject.color === ' purple lighten-1' || subject.color === 'grey' || subject.color === 'black' ? '#fff' :  '#fff'}' />
          {/if}
        </Button>
      </div>


      <!-- subject name -->
      <p class="is-unselectable txt-size-14 pos-abs pos-r-10 pos-b-10 max-w-{innerWidth < 571 && innerWidth > 473 ? '180' : '200'} txt-overflow-ellipsis overflow-x-hidden mb-0">
        {#if $selectedSubject.id === subject.id && $subjectSettingsPanelActive}
          {$newSubjectName}
        {:else}
          {subject.name}
        {/if}
      </p>
    </div>
  </a>
  </div>
</div>