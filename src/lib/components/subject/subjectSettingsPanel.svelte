<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
  import constants from '$lib/configs/constants';
	import { global_USERID, hintText, modalChosenColor, navDrawerActive, notifCenterOpen, notifs } from '$lib/stores/global.store';
  import { confirmDeleteModalActive, newSubjectName, selectedSubject, subjectSettingsPanelActive } from '$lib/stores/subject.store'
	import { mdiClose } from '@mdi/js';
	import { TextField, Button, Icon, Divider, Switch} from 'svelte-materialify';
  import { Pulse } from 'svelte-loading-spinners'
	import models from '$lib/models';

  export let data

  let updating = false
  let changes = 0
  let innerWidth = 0
  
  $: isFavorite1 = data.user.favorites[0].ids.includes($selectedSubject.id)
  $: isFavorite = isFavorite1
  $: addFavorite = isFavorite1 == false && isFavorite == true ? 'add' : isFavorite1 == true && isFavorite == false ? 'rem' : 'nothing'
  $: subjectNameError = $newSubjectName === ''
  $: size = innerWidth < 571 ? 'small' : 'large'

  const updateSubject = async () => {
    if(updating) return
    changes = 0
    if($newSubjectName === '') return
    if($selectedSubject.name !== $newSubjectName) changes++
    if($selectedSubject.color !== $modalChosenColor) changes++
    if(isFavorite1 != isFavorite) changes++
    if(changes == 0) return

    updating = true

    let form = document.getElementById('formUpdateSubject')
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
      $notifs = [...$notifs, {
        msg: 'Updated successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    updating = false
    subjectSettingsPanelActive.set(false)
    modalChosenColor.set('primary')
    newSubjectName.set('')
    selectedSubject.set(models.subject)
  }
</script>

<svelte:window bind:innerWidth />

<form id='formUpdateSubject' class="is-hidden" action="?/updateSubject" use:enhance>
  <input type="text" bind:value={$newSubjectName} name='name'>
  <input type="text" bind:value={$modalChosenColor} name='color'>
  <input type="text" bind:value={$selectedSubject.id} name='id'>
  <input type="text" bind:value={addFavorite} name='addFavorite'>
</form>

<div
  class="has-transition z-{$confirmDeleteModalActive || $notifCenterOpen || $navDrawerActive ? 'n100' : '30'} pos-fix p-2 pos-t-57 pos-r-0 maxmins-h-calc-100vh-65px maxmins-w-400-dt-to-mb-100p has-background-white-bis {!$subjectSettingsPanelActive ? 'rot-y-90' : 'rot-y-0'} rounded-b elevation-4 is-flex is-flex-direction-column"
  style='transform-origin: top right'
>
  <!-- title -->
  <div class='maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center'>
    <div class="fredoka-reg is-size-6-desktop is-size-7-touch">
      Subject settings
    </div>
    <div on:mouseenter={() => hintText.set('Click the X button to exit')}>
    <Button
      icon
      disabled={updating}
      on:click={() => {
        if(updating) return
        newSubjectName.set('')
        subjectSettingsPanelActive.set(false)
      }}
    >
      <Icon class='has-text-danger' path={mdiClose} />
    </Button>
    </div>
  </div>

  <Divider class='mt-2 {$selectedSubject.owner !== $global_USERID ? 'mb-3' : ''}' />

  {#if $selectedSubject.owner !== $global_USERID}
    <div class="txt-size-12 fredoka-reg has-text-grey-dark">
      Only the creator/owner of this subject can edit things here
    </div>

    <Divider class='mt-3 mb-2' />
  {/if}

  <div on:mouseenter={() => hintText.set('Input new subject name if you want')} class="has-background-white-bis">
    <TextField
      outlined
      color='indigo darken-4'
      class='fredoka-reg mb-4 {$selectedSubject.owner !== $global_USERID ? 'opacity-20p' : ''}'
      required
      counter={30}
      disabled={$selectedSubject.owner !== $global_USERID || updating}
      error={subjectNameError && $selectedSubject.owner === $global_USERID}
      bind:value={$newSubjectName}
      rules={[
        /** @param {string} v*/ v => v !== '' || 'Subject name cannot be empty',
        /** @param {string} v*/ v => v.length <= 30 || 'Subject name must be only 30 or less characters',
      ]}
    >
      Subject name
    </TextField>
  </div>

  <div on:mouseenter={() => hintText.set('Click on a color to change the subject color')} class="maxmins-w-100p is-flex is-justify-content-center is-flex-wrap-wrap">
    {#each constants.colors as color}
      <div class="maxmins-w-30p centerxy min-h-fit-content py-3">
        <Button
          fab
          depressed
          size='large'
          class='has-background-{color} centerxy {$selectedSubject.owner !== $global_USERID ? 'opacity-20p' : ''}'
          disabled={$selectedSubject.owner !== $global_USERID || updating}
          on:click={() => modalChosenColor.set(color)}
        >
          <div class="rounded-circle maxmins-w-10 maxmins-h-10 has-background-white {$modalChosenColor === color ? '' : 'is-hidden'}"/>
        </Button>
      </div>
    {/each}
  </div>

  <div on:mouseenter={() => hintText.set('Click on favorite if its your favorite subject')} class='maxmins-w-100p mt-6 p-3'>
    <Switch color='yellow' inset bind:checked={isFavorite}>
      <div class="fredoka-reg">
        Favorite
      </div>
    </Switch>
  </div>

  <div class="maxmins-w-100p flex-grow-1 pr-3 pb-3 is-flex is-flex-direction-column is-justify-content-flex-end">
    <div class="maxmins-w-100p is-flex is-justify-content-space-between">
      <div on:mouseenter={() => hintText.set('Click delete if you want to delete the subject')}>
        <Button  
          depressed
          class='has-background-danger{$selectedSubject.owner !== $global_USERID ? '-light' : ''} has-text-white {updating ? 'opacity-0p' : ''}'
          disabled={$selectedSubject.owner !== $global_USERID || updating}
          on:click={() => confirmDeleteModalActive.set(true)}
        >
          Delete
        </Button>
      </div>
      <div on:mouseenter={() => hintText.set('Click on update if you want to save your changes')}>
      <Button
        depressed
        class='has-background-grey-light{$selectedSubject.owner !== $global_USERID ? 'er' : ''}'
        disabled={$selectedSubject.owner !== $global_USERID || updating}
        on:click={updateSubject}
      >
        {#if !updating}
          Update
        {:else}
          <Pulse size={20} color='#fff' />
        {/if}
      </Button>
      </div>
    </div>
  </div>
</div>