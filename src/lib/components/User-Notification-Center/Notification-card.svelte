<script>
  //@ts-nocheck
  import { Avatar, Button, Icon } from 'svelte-materialify'
  import { mdiAccountCircleOutline, mdiCircleSmall, mdiClose, mdiTrashCan } from '@mdi/js'
  import { Moon, Pulse } from 'svelte-loading-spinners'
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { notifCenterOpen, notifs } from '$lib/stores/global.store';
	import { goto, invalidateAll } from '$app/navigation';

  /** @type {import('@prisma/client').notifications}*/
  export let notification
  export let data
  export let profileb = ''

  let removing = false
  let reading = false

  const setReadNotif = async () => {
    if(reading) return
    reading = true

    if(notification.isRead) {
      if(notification.anInvitation) {
        await goto(`/${data.user.email}/invitations`, {replaceState: true, invalidateAll: true})
      } else {
        if(notification.fromInterface.interf !== '') {
          if(notification.fromInterface.subInterface !== '') {
            if(notification.fromTask !== '') {
              await goto(`/${data.user.email}/${notification.fromInterface.interf}/${notification.fromInterface.subInterface}/${notification.fromTask}`, {replaceState: true, invalidateAll: true})
            } else {
              await goto(`/${data.user.email}/${notification.fromInterface.interf}/${notification.fromInterface.subInterface}`, {replaceState: true, invalidateAll: true})
            }
          } else {
            await goto(`/${data.user.email}/${notification.fromInterface.interf}`, {replaceState: true, invalidateAll: true})
          }
        }
      }
      notifCenterOpen.set(false)
      reading = false
      return
    }

    let form = document.getElementById(`formReadNotif${notification.id}`)
    const data2 = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data2
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
      notifCenterOpen.set(false)
      await invalidateAll();
    }

    applyAction(result);
    reading = false
  }

  const deleteNotif = async () => {
    if(removing) return
    removing = true

    let form = document.getElementById(`formRemoveNotif${notification.id}`)
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
      await invalidateAll();
    }

    applyAction(result);
    removing = false
    delHover = false
  }

  let innerWidth = 0
  let notifHovering = false
  let delHover = false
  let draggedRight = false
  let draggedLeft = false
  let draggedRightCount = 0
  let initPos = {x: 0, y: 0}

  $: anInvitation = notification.anInvitation ? 'true' : 'false'

</script>

<svelte:window bind:innerWidth />

<!-- FORMMSSSS -->
<div class='is-hidden'>
  <form action="/{data.user.email}?/removeNotif" id='formRemoveNotif{notification.id}' class='is-hidden' use:enhance>
    <input type="text" name='notifID' bind:value={notification.id}>
  </form>

  <form action="/{data.user.email}?/readNotif" id='formReadNotif{notification.id}' class='is-hidden' use:enhance>
    <input type="text" name='notifID' bind:value={notification.id}>
    <input type="text" name='anInvitation' bind:value={anInvitation}>
    <input type="text" name='subjectID' bind:value={notification.fromInterface.interf}>
    <input type="text" name='workspaceID' bind:value={notification.fromInterface.subInterface}>
    <input type="text" name='taskID' bind:value={notification.fromTask}>
  </form>
</div>

<div class="is-flex flex-shrink-0 is-align-items-center overflow-x-hidden">
  <div class="{innerWidth > 570 ? 'is-hidden' : ''} is-flex is-justify-content-center is-align-items-center is-relative pos-l-{draggedRight ? '15' : 'n40p'} has-transition">
    <Icon size='30px' path={mdiTrashCan} />
  </div>
  
  <div class="{innerWidth > 570 ? 'is-hidden' : ''} maxmins-w-30 fredoka-reg txt-size-10 is-flex is-justify-content-center is-align-items-center pos-abs pos-r-{draggedLeft ? '15' : 'n40'} has-transition">
    Cancel
    Delete
  </div>
  
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    on:click={setReadNotif}
    on:mouseenter={e => notifHovering = true}
    on:mouseleave={e => notifHovering = false}
    on:touchstart={e => {
      initPos.x = e.touches[0].clientX
      initPos.y = e.touches[0].clientY
    }}
    on:touchmove={e => {
      if(initPos.x - e.touches[0].clientX < 0 && outerWidth < 571) {
        draggedRight = true
        draggedRightCount++
        draggedLeft = false
      }else if(initPos.x - e.touches[0].clientX > 0 && outerWidth < 571 && draggedRightCount > 0) {
        draggedRightCount = 0
        draggedRight = false
        draggedLeft = true
      }
    }}
    on:touchcancel={e => {
      draggedRight = false
      draggedLeft = false
    }}
    on:touchend={e => {
      if(draggedLeft) {
        draggedLeft = false
        draggedRight = false
        return
      }
      if(draggedRight) deleteNotif()
    }}
    class="{notification.isRead ? 'opacity-60p': ''} pos-l-{draggedRight ? '30' : draggedLeft ? 'n70': innerWidth < 571 ? 'n30' : '0'} is-relative maxmins-w-100p parent rounded min-h-fit-content mb-2 {removing? 'a': ''}is-clickable {!delHover ?  'has-background-grey-lighter' : 'has-background-danger-light'} has-transition">
  
    <div class="is-flex is-align-items-center is-justify-content-space-between maxmins-h-100p p-1">
      <div class="is-flex is-align-items-center">
        <!-- Image -->
        <div class="is-flex is-align-items-center is-justify-content-center">
          <Avatar size='50px'>
            {#if profileb !== ''}
              <img src={profileb} alt="from another user profile">
            {:else}
              <Icon class="white blue-text" path={mdiAccountCircleOutline} />
            {/if}
          </Avatar>
        </div>
    
        <!-- notification message -->
        <div class="ml-2 p-1 txt-size-12 fredoka-reg {delHover? 'has-text-danger-dark' : ''}">
          {notification.message}
        </div>
      </div>
  
      <!-- notification action and note -->
      <div
        on:mouseenter={e => delHover = true}
        on:mouseleave={e => delHover = false}
        on:click={deleteNotif}
      >
        {#if !removing && !reading}
          {#if !notification.isRead}
            <Button icon class="{delHover ? 'has-background-danger' : ''} has-transition is-flex is-align-items-center is-justify-content-center">
              {#if !notifHovering}
                <Icon class='green-text' size='60px' path={mdiCircleSmall} />
              {:else}
                <Icon class='white-text' size='15px' path={mdiClose} />
              {/if}
            </Button>
          {:else}
            {#if !notifHovering}
              <div/>
            {:else}
              <Button icon class="has-background-danger-dark is-flex is-align-items-center">
                <Icon class='white-text' size='15px' path={mdiClose} />
              </Button>
            {/if}
          {/if}
        {:else}
          <Moon size={20} color='#000' />
        {/if}
      </div>
    </div>
  </div>
</div>