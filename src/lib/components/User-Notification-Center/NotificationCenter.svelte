<script>
  //@ts-nocheck
  import { Button, Icon } from "svelte-materialify"
  import { notifCenterOpen, notifs, hintText } from '$lib/stores/global.store'
  import { mdiNotificationClearAll, mdiRead, mdiRobotLove } from "@mdi/js"
  import NotificationCard from "./Notification-card.svelte"
	import { applyAction, deserialize, enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";

  /**
   * @type {import('@prisma/client').notifications[]}
   */
  export let notifications
  /** 
   * @type {{notifID: string, profile: string}[]}
   * */
  export let notifFromPic
  export let data

  let innerWidth = 0
  let removing = false
  let reading = false


  const clearAllNotifs = async () => {
    if(removing) return
    removing = true

    let form = document.getElementById(`removeAllNotifs`)
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
  }

  const readAllNotifs = async () => {
    if(reading) return
    reading = true

    let form = document.getElementById(`readAllNotifs`)
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
    reading = false
  }
</script>

<svelte:window bind:innerWidth />

<form action="/{data.user.email}?/removeAllNotifs" id='removeAllNotifs' class='is-hidden' use:enhance>
  <input type="text" name='id' bind:value={data.user.id}>
</form>

<form action="/{data.user.email}?/readAllNotifs" id='readAllNotifs' class='is-hidden' use:enhance></form>

<div
  class="has-transition z-99 pos-fix p-2 pos-t-57 pos-r-0 maxmins-h-calc-100vh-65px maxmins-w-400-dt-to-mb-100p has-background-white-bis {!$notifCenterOpen? 'rot-y-90' : 'rot-y-0'} rounded-b elevation-4 is-flex is-flex-direction-column"
  style='transform-origin: top right'
>
  <!-- Notification title -->
  <div class="fredoka-reg is-size-6-desktop is-size-7-touch">
    Notifications
  </div>

  <!-- Notication Center Content -->
  <div class="is-flex is-flex-direction-column maxmins-w-100p flex-grow-1 overflow-y-auto rounded">
    {#if notifications.length > 0}
      {#each notifications as notification}
        <NotificationCard {data} {notification} profileb={notifFromPic.filter(nfp => nfp.notifID === notification.id)[0].profile} />
      {/each}
    {:else}
      <div class='maxmins-w-100p centerxy is-flex-direction-column mt-16 grey-text text-lighten-1'>
        <div class='fredoka-reg txt-size-20'>
          Enjoy your day!
        </div>
        <div>
          <Icon size={60} class='grey-text text-lighten-1' path={mdiRobotLove} />
        </div>
      </div>
    {/if}
  </div>

  <div class="pt-2 maxmins-w-100p is-flex is-align-items-center is-justify-content-space-evenly ">
    <Button
      text
      size='small'
      class="is-flex is-justify-content-center is-align-items-center maxmins-w-35p {notifications.length > 0 ? '' : 'opacity-0p'}"
      disabled={removing || reading || notifications.length == 0}
      on:click={readAllNotifs}
    >
      <Icon size='15px' path={mdiRead} />
      <div on:mouseenter={() => hintText.set('Click on the button read all to change the notification status to read')} class="fredoka-reg ml-3 txt-size-11">
        Read all
      </div>
    </Button>
    
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <Button
      text
      size='small'
      disabled={removing || reading || notifications.length == 0}
      on:click={clearAllNotifs}
      class="is-flex is-justify-content-center is-align-items-center maxmins-w-35p {notifications.length > 0 ? '' : 'opacity-0p'}">
      <Icon size='15px' path={mdiNotificationClearAll} />
      <div on:mouseenter={() => hintText.set('Click the clear all button to clear notifications')} class="fredoka-reg ml-3 txt-size-11">
        Clear all
      </div>
    </Button>
  </div>

</div>