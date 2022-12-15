<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
  import constants from '$lib/configs/constants';
	import { global_USERID, modalChosenColor, navDrawerActive, notifCenterOpen, notifs } from '$lib/stores/global.store';
  import { addSubjectPanelActive, newSubjectName } from '$lib/stores/subject.store'
	import { mdiClose } from '@mdi/js';
	import { TextField, Button, Icon, Divider} from 'svelte-materialify';
  import { Pulse } from 'svelte-loading-spinners'

  let creating = false
  let innerWidth = 0
  
  $: subjectNameError = $newSubjectName === ''

  const createSubject = async () => {
    if(creating) return
    if($newSubjectName === '') return
    creating = true

    let form = document.getElementById('formAddSubject')
    const data = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    console.log(result);

    if(result.type === 'invalid') {
      $notifs = [...$notifs, {
        msg: result.data.message,
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      $notifs = [...$notifs, {
        msg: 'Created successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      await invalidateAll();
    }

    applyAction(result);
    creating = false
    addSubjectPanelActive.set(false)
    modalChosenColor.set('primary')
    newSubjectName.set('')
  }
</script>

<svelte:window bind:innerWidth />

<form id='formAddSubject' class="is-hidden" action="?/createSubject" use:enhance>
  <input type="text" bind:value={$newSubjectName} name='name'>
  <input type="text" bind:value={$modalChosenColor} name='color'>
  <input type="text" bind:value={$global_USERID} name='owner'>
</form>

<div
  class="has-transition z-{$notifCenterOpen || $navDrawerActive ? 'n100' : '30'} pos-abs p-2 pos-t-57 pos-r-0 maxmins-h-calc-100vh-65px maxmins-w-400-dt-to-mb-100p has-background-white-bis {!$addSubjectPanelActive ? 'rot-y-90' : 'rot-y-0'} rounded-b elevation-4 is-flex is-flex-direction-column"
  style='transform-origin: top right'
>
  <!-- title -->
  <div class='maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center'>
    <div class="fredoka-reg is-size-6-desktop is-size-7-touch">
      Add subject
    </div>
  
    <Button
      icon
      disabled={creating}
      on:click={() => {
        if(creating) return
        newSubjectName.set('')
        addSubjectPanelActive.set(false)
      }}
    >
      <Icon class='has-text-danger' path={mdiClose} />
    </Button>
  </div>

  <Divider class='mt-2' />

  <div class="has-background-white-bis">
    <TextField
      outlined
      color='indigo darken-4'
      class='fredoka-reg mb-4'
      required
      counter={30}
      disabled={creating}
      error={subjectNameError}
      bind:value={$newSubjectName}
      rules={[
        /** @param {string} v*/ v => v !== '' || 'Subject name cannot be empty',
        /** @param {string} v*/ v => v.length <= 30 || 'Subject name must be only 30 or less characters',
      ]}
    >
      Subject name
    </TextField>
  </div>

  <div class="maxmins-w-100p is-flex is-justify-content-center is-flex-wrap-wrap">
    {#each constants.colors as color}
      <div class="maxmins-w-30p centerxy min-h-fit-content py-3">
        <Button
          fab
          depressed
          disabled={creating}
          size='large'
          class='has-background-{color} centerxy'
          on:click={() => modalChosenColor.set(color)}
        >
          <div class="rounded-circle maxmins-w-10 maxmins-h-10 has-background-white {$modalChosenColor === color ? '' : 'is-hidden'}"/>
        </Button>
      </div>
    {/each}
  </div>

  <div class="maxmins-w-100p flex-grow-1 pr-3 pb-3 is-flex is-flex-direction-column is-justify-content-flex-end">
    <div class="maxmins-w-100p is-flex is-justify-content-flex-end">
      <Button
        depressed
        class='has-background-grey-light'
        disabled={creating}
        on:click={createSubject}
      >
        {#if !creating}
          Create
        {:else}
          <Pulse size={20} color='#fff' />
        {/if}
      </Button>
    </div>
  </div>
</div>