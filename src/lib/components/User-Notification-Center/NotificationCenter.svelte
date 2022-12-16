<script>
  //@ts-nocheck
  import { Button, Icon } from "svelte-materialify"
  import { notifCenterOpen } from '$lib/stores/global.store'
  import { mdiNotificationClearAll, mdiRead } from "@mdi/js"
  import NotificationCard from "./Notification-card.svelte"
  import bcrypt from 'bcryptjs'
	import models from "$lib/models";

  let innerWidth = 0
  /**
   * @type {import('@prisma/client').notifications[]}
   */
  export let notifications

  /** 
   * @type {{notifID: string, profile: string}[]}
   * */
  export let notifFromPic

  const clearAllNotifs = () => {
    // let userDataCopy = $userData
    // userDataCopy.notifications = []
    // userData.set(userDataCopy)

    // notifCenterOpen.set(false)

    // fetch(`${constants.backURI}/User/delete/all/notification`, {
    //   method: 'DELETE',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     userID: $userData.id
    //   })
    // }).then(async res => {
    //   const { notifications } = await res.json()
    //   let userDataCopy = $userData
    //   userDataCopy.notifications = notifications
    //   userData.set(userDataCopy)
    // }).catch(err => {
    //   let notifsCopy = $notifs
    //   notifsCopy.push({
    //     msg: `Error in deleting ALL the notificaton, ${err}`,
    //     type: 'error',
    //     id: bcrypt.hashSync(`${new Date().getMilliseconds() * (Math.random() * 1)}`, 13)
    //   })
    //   notifs.set(notifsCopy)
    //   console.error(err)
    // })
  }
</script>

<svelte:window bind:innerWidth />

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
    {#each notifications as notification}
      <NotificationCard {notification} profileb={notifFromPic.filter(nfp => nfp.notifID === notification.id)[0].profile} />
    {/each}
  </div>

  <div class="pt-2 maxmins-w-100p is-flex is-align-items-center is-justify-content-space-evenly ">
    <Button
      text
      size='small'
      class="is-flex is-justify-content-center is-align-items-center maxmins-w-35p"
    >
      <Icon size='15px' path={mdiRead} />
      <div class="fredoka-reg ml-3 txt-size-11">
        Read all
      </div>
    </Button>
    
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <Button
      text
      size='small'
      on:click={clearAllNotifs}
      class="is-flex is-justify-content-center is-align-items-center maxmins-w-35p">
      <Icon size='15px' path={mdiNotificationClearAll} />
      <div class="fredoka-reg ml-3 txt-size-11">
        Clear all
      </div>
    </Button>
  </div>

</div>