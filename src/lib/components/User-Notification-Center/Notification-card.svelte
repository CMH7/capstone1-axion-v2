<script>
  //@ts-nocheck
  import { breadCrumbsItems, invModalActive, notifCenterOpen, notifs } from '$lib/stores/global.store'
  import {activeSubject, activeWorkspace} from '$lib/stores/dashboard.store'
  import { Avatar, Button, Icon } from 'svelte-materialify'
  import { mdiAccountCircleOutline, mdiCircleSmall, mdiClose, mdiDotNet, mdiTrashCan } from '@mdi/js'
  import { Pulse } from 'svelte-loading-spinners'

  /** @type {import('@prisma/client').notifications}*/
  export let notification

  export let profileb = ''

  const setReadNotif = () => {
    // if($isProcessing || delHover) return
    // isProcessing.set(true)
    // fetch(`${constants.backURI}/User/notification?user=${$userData.id}&notification=${notification.id}`, {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // }).then(async res => {
    //   const { id } = await res.json()
    //   let userDataCopy = $userData
    //   userDataCopy.notifications.every(notification => {
    //     if(notification.id === id) {
    //       notification.isRead = true
    //       return false
    //     }
    //     return true
    //   })
    //   userData.set(userDataCopy)
    // }).catch(err => {
    //   $notifs = [...$notifs, {
    //     msg: `Error in seting isRead of the notificaton, ${err}`,
    //     type: 'error',
    //     id: bcrypt.hashSync(`${new Date().getMilliseconds() * (Math.random() * 1)}`, 13)
    //   }]
    //   console.error(err)
    // }).finally(() => {
    //   isProcessing.set(false)
    // })
  }

  const deleteNotif = () => {
    console.log('deleted');
    // if(outerWidth > 570) {
    //   if($isProcessing || !delHover) return
    // }
    // isProcessing.set(true)
    // isDeleting = true
    // fetch(`${constants.backURI}/User/delete/notification`, {
    //   method: 'DELETE',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     ids: {
    //       user: $userData.id,
    //       notification: notification.id
    //     }
    //   })
    // }).then(async res => {
    //   const { id } = await res.json()
    //   let userDataCopy = $userData
    //   userDataCopy.notifications = userDataCopy.notifications.filter(notificationa => notificationa.id != id)
    //   userData.set(userDataCopy)
    // }).catch(err => {
    //   $notifs = [...$notifs, {
    //     msg: `Error in deleting the notificaton, ${err}`,
    //     type: 'error',
    //     id: $notifs.length + 1
    //   }]
    //   console.error(err)
    // }).finally(() => {
    //   isProcessing.set(false)
    //   draggedLeft = false
    //   draggedRight = false
    //   draggedRightCount = 0
    //   isDeleting = false
    //   if($userData.notifications.length === 0) notifCenterOpen.set(false)
    // })
  }

  const transpo = () => {
    // if(delHover || isDeleting || $isProcessing) return
    // if(notification.anInvitation) {
    //   if(!notification.isRead) setReadNotif()
    //   invModalActive.set(true)
    //   notifCenterOpen.set(false)
    //   return
    // }
    // if(notification.fromTask || notification.aMention) {
    //   if(!notification.isRead) setReadNotif()
    //   currentInterface.set('Dashboard')
    //   currentDashboardSubInterface.set('Boards')
    //   $userData.subjects.every(subject => {
    //     subject.workspaces.every(workspace => {
    //       workspace.boards.every(board => {
    //         board.tasks.every(task => {
    //           if(task.id === notification.fromTask) {
    //             activeSubject.set(subject)
    //             activeWorkspace.set(workspace)
    //             allBoards.set(workspace.boards)
    //             activeTask.set(task)
    //             $breadCrumbsItems = [{text: $activeSubject.name, href: '1'}, {text: $activeWorkspace.name, href: '2'}, {text: 'boards', href: '3'}]
    //             return false
    //           }
    //           return true
    //         })
    //         return true
    //       })
    //       return true
    //     })
    //     return true
    //   })
    //   taskViewModalActive.set(true)
    //   notifCenterOpen.set(false)
    //   return
    // }
  }

  let innerWidth = 0
  let notifHovering = false
  let delHover = false
  let draggedRight = false
  let draggedLeft = false
  let draggedRightCount = 0
  let initPos = {x: 0, y: 0}
  let isDeleting = false
</script>

<svelte:window bind:innerWidth />

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
    on:click={transpo}
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
    class="{notification.isRead ? 'opacity-60p': ''} pos-l-{draggedRight ? '30' : draggedLeft ? 'n70': innerWidth < 571 ? 'n30' : '0'} is-relative maxmins-w-100p parent rounded maxmins-h-60 mb-2 {isDeleting? 'a': ''}is-clickable {!delHover ?  'has-background-grey-lighter' : 'has-background-danger-light'} has-transition">
  
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
        on:click={e => deleteNotif()}
      >
        {#if !isDeleting}
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
          <Pulse size={10} color='#191a48' />
        {/if}
      </div>
    </div>
  </div>
</div>