<script>
	import { applyAction, deserialize, enhance } from '$app/forms';

  // @ts-nocheck
	import { goto, invalidateAll } from '$app/navigation';
	import NothingFound from '$lib/components/nothingFound.svelte';
	import helpers from '$lib/configs/helpers';
	import { breadCrumbsItems, currentIndex, global_USERID, hintText, loadingScreen, notifs } from '$lib/stores/global.store';
	import { mdiAccountOutline, mdiArrowLeftBold, mdiArrowRightBold, mdiMagnify } from '@mdi/js';
	import bcryptjs from 'bcryptjs';
	import { onMount } from 'svelte'
	import { Moon } from 'svelte-loading-spinners';
	import { Avatar, Button, Card, Checkbox, Icon, TextField } from 'svelte-materialify';

  /** @type {import('./$types').PageServerData}*/
  export let data

  /** @type {import('@prisma/client').invitations[]}*/
  let invitations = []
  let innerWidth = 0
  let currentInv = ''
  let processing = false
  let from = ''
  let searchFor = ''
  let fromMe = true
  let fromOthers = true

  $: update(data)
  $: update = ( /** @type {import('./$types').PageServerData}*/ data) => {
    if(!fromMe && !fromOthers) {
      invitations = []
    } else if (fromMe && !fromOthers) {
      invitations = data.invitations.filter(i => i.from.id === data.user.id)
    } else if (!fromMe && fromOthers) {
      invitations = data.invitations.filter(i => i.to.id === data.user.id)
    } else if (fromMe && fromOthers) {
      invitations = data.invitations
    }

    if(searchFor !== '') {
      invitations = invitations.filter(i => `${i.from.name} ${i.from.email} ${i.workspace.name}`.toLowerCase().match(searchFor.toLowerCase()))
    } else {
      if(!fromMe && !fromOthers) {
        invitations = []
      } else if (fromMe && !fromOthers) {
        invitations = data.invitations.filter(i => i.from.id === data.user.id)
      } else if (!fromMe && fromOthers) {
        invitations = data.invitations.filter(i => i.to.id === data.user.id)
      } else if (fromMe && fromOthers) {
        invitations = data.invitations
      }
    }
  }
  $: global_USERID.set(data.user.id)

  const declineInv = async () => {
    if(processing) return
    processing = true

    let form = document.getElementById('formDeclineInvitation')
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
      $notifs = [...$notifs, {
        msg: 'Declined successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    processing = false
    currentInv = ''
  }
  
  const cancelInv = async () => {
    if(processing) return
    processing = true

    let form = document.getElementById('formCancelInvitation')
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
      $notifs = [...$notifs, {
        msg: 'Canceled successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    processing = false
    currentInv = ''
  }
  
  /**
   * @param {string} f
  */
  const removeInv = async (f) => {
    if(processing) return
    processing = true
    from = f

    let form = document.getElementById('formRemoveInvitation')
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
      $notifs = [...$notifs, {
        msg: 'Removed successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    processing = false
    currentInv = ''
  }

  const acceptInv = async () => {
    if(processing) return
    processing = true

    let form = document.getElementById('formAcceptInvitation')
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
      $notifs = [...$notifs, {
        msg: 'Accepted successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    processing = false
    currentInv = ''
  }

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
    helpers.resetPanels()
  })
</script>

<svelte:head>
  <title>My profile</title>
</svelte:head>

<svelte:window bind:innerWidth />

<div class='is-hidden'>
  <form action="?/declineInvitation" id='formDeclineInvitation' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.user.id}>
    <input type="text" name='invID' bind:value={currentInv}>
  </form>

  <form action="?/removeInvitation" id='formRemoveInvitation' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.user.id}>
    <input type="text" name='invID' bind:value={currentInv}>
    <input type="text" name='from' bind:value={from}>
  </form>

  <form action="?/cancelInvitation" id='formCancelInvitation' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.user.id}>
    <input type="text" name='invID' bind:value={currentInv}>
  </form>

  <form action="?/acceptInvitation" id='formAcceptInvitation' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.user.id}>
    <input type="text" name='invID' bind:value={currentInv}>
  </form>
</div>

<div class='columns is-mobile is-multiline'>
  <div class='column is-12'>
    <div on:mouseenter={() => hintText.set('Input the name, email etc. of your invitations')} class='maxmins-w-100p is-flex is-flex-wrap-wrap is-align-items-center'>
      <div class='maxmins-w-{innerWidth < 571 ? '100p' : '400'} mr-3'>
        <TextField bind:value={searchFor} color='grey' type='text' outlined dense class='fredoka-reg'>
          Search from name, email or workspace
          <div slot='append' class="is-clickable">
            <Icon path={mdiMagnify} />
          </div>
        </TextField>
      </div>

      <div on:mouseenter={() => hintText.set('Check or uncheck if the invitation is for you')} class='mr-3 {innerWidth < 571 ? 'mt-3' : ''}'>
        <Checkbox color='green' bind:checked={fromMe} >
          <div class="fredoka-reg has-text-grey">
            From me
          </div>
        </Checkbox>
      </div>
      
      <div on:mouseenter={() => hintText.set('Check or uncheck if the invitation is for others')} class=' {innerWidth < 571 ? 'mt-3' : ''}'>
        <Checkbox color='green' bind:checked={fromOthers} >
          <div class="fredoka-reg has-text-grey">
            From others
          </div>
        </Checkbox>
      </div>
    </div>
  </div>
  {#if invitations.length != 0}
    {#each invitations as invitation}
      <div class="column is-2-desktop is-4-tablet is-12-mobile" style='overflow-x: hidden' on:mouseenter={() => {
        if(processing) return
        currentInv = invitation.id
      }}>
        <Card>
          <div class='maxmins-w-100p p-2'>
            <!-- arrow -->
            <div class='maxmins-w-100p is-flex is-justify-content-space-around p-2'>
              <Avatar>
                {#if data.user.profile !== ''}
                  <img src="{data.user.profile}" alt="pic">
                {:else}
                  <Icon class='blue-text' path={mdiAccountOutline} />
                {/if}
              </Avatar>

              {#if invitation.from.id === data.user.id}
              <Icon class='{invitation.status === 'Pending' ? 'indigo' : invitation.status === 'Canceled' || invitation.status === 'Declined' ? 'red' : 'green'}-text text-{invitation.status === 'Declined' ? 'darken-4' : 'lighten-3'}' size={50} path={mdiArrowRightBold} />
              {:else}
              <Icon class='{invitation.status === 'Pending' ? 'indigo' : invitation.status === 'Canceled' || invitation.status === 'Declined' ? 'red' : 'green'}-text text-{invitation.status === 'Pending' || invitation.status === 'Declined' ? 'darken-4' : 'lighten-3'}' size={50} path={mdiArrowLeftBold} />
              {/if}
              
              {#if invitation.from.id === data.user.id}
                <Avatar>
                  {#if data.toPics.filter(u => u.id === invitation.to.id)[0].profile !== ''}
                    <img src="{data.toPics.filter(u => u.id === invitation.to.id)[0].profile}" alt="pic">
                  {:else}
                    <Icon class='blue-text' path={mdiAccountOutline} />
                  {/if}
                </Avatar>
              {:else}
                <Avatar>
                  {#if invitation.from.profile !== ''}
                    <img src="{invitation.from.profile}" alt="pic">
                  {:else}
                    <Icon class='blue-text' path={mdiAccountOutline} />
                  {/if}
                </Avatar>
              {/if}
            </div>

            <!-- message -->
            <div class='maxmins-w-100p px-3 my-3'>
              <div class='notification fredoka-reg txt-size-15 p-2'>
                {invitation.message}
              </div>
            </div>

            <!-- status and workspace name -->
            <div class='maxmins-w-100p centerxy'>
              <div class='tags has-addons fredoka-reg txt-size-15 p-2'>
                <div class='tag {invitation.status === 'Pending' ? 'is-info is-light' : invitation.status === 'Declined' || invitation.status === 'Canceled' ? 'is-danger' : 'is-success'}'>
                  {invitation.status}
                </div>
                <div class='tag is-info'>
                  {invitation.workspace.name}
                </div>
              </div>
            </div>

            <!-- buttons -->
            <div class='maxmins-w-100p is-flex is-align-items-center is-justify-content-flex-end mt-6'>
              {#if !processing || currentInv !== invitation.id}
                {#if invitation.from.id === data.user.id}
                  {#if invitation.status === 'Pending'}
                    <div />

                    <Button text size='small' class='has-background-danger has-text-white ml-3' on:click={cancelInv}>
                      Cancel
                    </Button>
                  {:else}
                    <Button text size='small' class='has-background-danger has-text-white ml-3' on:click={() => removeInv(invitation.from.id === data.user.id ? 'yes' : 'no')}>
                      Remove
                    </Button>
                  {/if}
                {:else}
                  {#if invitation.status === 'Pending'}
                    <Button text size='small' class='has-background-success has-text-white' on:click={acceptInv}>
                      Accept
                    </Button>
                    
                    <Button text size='small' class='has-background-danger has-text-white ml-3' on:click={declineInv}>
                      Decline
                    </Button>
                  {:else}
                    <Button text size='small' class='has-background-danger has-text-white ml-3' on:click={() => removeInv(invitation.from.id === data.user.id ? 'yes' : 'no')}>
                      Remove
                    </Button>
                  {/if}
                {/if}
              {:else}
                  <Moon size={30} color='#000' />
              {/if}
            </div>
          </div>
        </Card>
      </div>
    {/each}
  {:else}
      <NothingFound />
  {/if}
</div>
