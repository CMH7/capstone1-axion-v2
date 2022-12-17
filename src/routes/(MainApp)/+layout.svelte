<script>
  //@ts-nocheck
  import { ClickOutside, AppBar, Icon, NavigationDrawer, Overlay, Button, MaterialApp, Avatar, List, ListItem, ListItemGroup, Divider, Badge } from 'svelte-materialify'
  import {mdiBell, mdiViewDashboard, mdiAccountCheck, mdiTune, mdiStar, mdiAccount, mdiLogoutVariant, mdiMenu, mdiChevronLeft, mdiChevronRight, mdiAccountGroup } from '@mdi/js';
	import { goto, invalidateAll } from '$app/navigation';
	import { breadCrumbsItems, hintText, loading, loadingScreen, navDrawerActive, notifCenterOpen, notifs, currentIndex, global_USERID } from '$lib/stores/global.store';
	import { invModalActive } from '$lib/stores/dashboard.store';
	import { page } from '$app/stores';
	import NotificationCenter from '$lib/components/User-Notification-Center/NotificationCenter.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import { fade } from 'svelte/transition'
	import NotificationContainer from '$lib/components/System-Notification/Notification-container.svelte';
	import Fab from '$lib/components/fab/fab.svelte';
	import { onMount } from 'svelte';
	import AddSubjectPanel from '$lib/components/subject/addSubjectPanel.svelte';
	import SubjectSettingsPanel from '$lib/components/subject/subjectSettingsPanel.svelte';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import SubjectDeleteConfirmationModal from '$lib/components/subject/subjectDeleteConfirmationModal.svelte';
	import AddWorkspacePanel from '$lib/components/workspace/addWorkspacePanel.svelte';
	import WorkspaceSettingsPanel from '$lib/components/workspace/workspaceSettingsPanel.svelte';
	import WorkspaceDeleteConfirmationModal from '$lib/components/workspace/workspaceDeleteConfirmationModal.svelte';
	import AddTaskPanel from '$lib/components/task/addTaskPanel.svelte';
	import TaskSettingsPanel from '$lib/components/task/taskSettingsPanel.svelte';
	import TaskDeleteConfirmationModal from '$lib/components/task/taskDeleteConfirmationModal.svelte';
	import AddBoardPanel from '$lib/components/board/addBoardPanel.svelte';
	import BoardSettingsPanel from '$lib/components/board/boardSettingsPanel.svelte';
	import BoardDeleteConfirmationModal from '$lib/components/board/boardDeleteConfirmationModal.svelte';
	import WorkspaceRemoveMemberConfirmationModal from '$lib/components/workspace/workspaceRemoveMemberConfirmationModal.svelte';
	import WorkspaceDemoteWorkspaceAdmin from '$lib/components/workspace/workspaceDemoteWorkspaceAdmin.svelte';
	import WorkspacePromoteWorkspaceMember from '$lib/components/workspace/workspacePromoteWorkspaceMember.svelte';
  import { Pulse } from 'svelte-loading-spinners';
	import { addSubjectPanelActive, confirmDeleteModalActive, subjectSettingsPanelActive } from '$lib/stores/subject.store';
	import { addWorkspacePanelActive, confirmDeleteWorkspaceModalActive, workspaceSettingsPanelActive } from '$lib/stores/workspace.store';
	import { addTaskPanelActive, taskConfirmDeleteModalActive, taskSettingsPanelActive } from '$lib/stores/task.store';
	import { addBoardPanelActive, boardSettingsPanelActive, deleteBoardConfirmationModalActive } from '$lib/stores/boards.store';
	import helpers from '$lib/configs/helpers';
  import bcryptjs from 'bcryptjs'
	import UploadPicModal from '$lib/components/myProfile/uploadPicModal.svelte';
	import ChangePassCodeModal from '$lib/components/myProfile/changePassCodeModal.svelte';
	import ChangeEmailCodeModal from '$lib/components/myProfile/changeEmailCodeModal.svelte';
	import DeleteAccountConfirmationModal from '$lib/components/myProfile/deleteAccountConfirmationModal.svelte';
	import WorkspaceInviteUserModal from '$lib/components/workspace/workspaceInviteUserModal.svelte';
	import pusher from '$lib/configs/helpers/realtime';

  /**
   * @type {import('./$types').LayoutServerData}
   * */
  export let data

  let active = $navDrawerActive
  let innerWidth = 0
  let breadcrumbs = []
  let showProfileMenu = false
  let hint = true
  let removeHint = false
  let navs = [
    {name: "Dashboard", icon: mdiViewDashboard, color: "info", href: `/${data.user.email}`},
    {name: "Assigned to me", icon: mdiAccountCheck, color: "success", href: `/${data.user.email}/assigned-to-me`},
    {name: "Favorites", icon: mdiStar, color: "yellow-text text-darken-2", href: `/${data.user.email}/favorites`},
    {name: "My Profile", icon: mdiAccount, color: "grey-dark", href: `/${data.user.email}/my-profile`},
    {name: "Logout", icon: mdiLogoutVariant, color: "danger", href: `/${data.user.email}/my-profile`}
  ];

  breadCrumbsItems.subscribe(value => breadcrumbs = value)

  $: color = navs[$currentIndex].color

  const toggleNavigation = () => {
    active = !active
    navDrawerActive.set(active)
  }

  const navClicked = async (i) => {
    if(i == 0) breadcrumbs = [{text: 'Subjects', href: `/${data.user.email}`}]
    if(i == 1) breadcrumbs = [{text: 'Assigned to me', href: `/${data.user.email}/assigned-to-me`}]
    if(i == 2) breadcrumbs = [{text: 'Favorites', href: `/${data.user.email}/favorites`}]
    if(i == 3) breadcrumbs = [{text: 'My profile', href: `/${data.user.email}/my-profile`}]
    if(i == 4) {
      logout()
      return
    }
    if(innerWidth < 571) active = false
    
    currentIndex.set(i)
    // await goto(href, {replaceState: true})
  }

  const logout = async () => {
    let form = document.getElementById('formlogout')
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
        type: 'error',
        id: `${(Math.random() * 999) + 1}`
      }]
    }

    if(result.type === 'redirect') {
      $notifs = [...$notifs, {
        msg: 'Logout successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      localStorage.clear()
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
  }

  const hideHint = () => {
    hint = false
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
    global_USERID.set(data.user.id)
    helpers.pusher.connect()
    let channel = helpers.pusher.subscribe(data.user.id)
    channel.bind('updates', function(data) {
      invalidateAll()
    })
    console.log('pusher connected');
  })

  const unload = () => {
    pusher.disconnect()
    console.log('pusher disconnected');
    logout()
  }
</script>

<svelte:window bind:innerWidth on:unload={unload} />

<!-- make this form hidden always -->
<form id="formlogout" action="/{data.user.email}?/logout" class="is-hidden" use:enhance></form>

{#if $loading}
<LoadingScreen />
{:else}
  <div in:fade>
    <NotificationContainer />
    <AddSubjectPanel />
    <AddWorkspacePanel />
    <AddTaskPanel />
    <AddBoardPanel />

    <SubjectSettingsPanel {data} />
    <WorkspaceSettingsPanel {data} />
    <TaskSettingsPanel />
    <BoardSettingsPanel />


    <SubjectDeleteConfirmationModal />
    <WorkspaceDeleteConfirmationModal />
    <TaskDeleteConfirmationModal />
    <BoardDeleteConfirmationModal />

    <WorkspaceRemoveMemberConfirmationModal />
    <WorkspaceDemoteWorkspaceAdmin />
    <WorkspacePromoteWorkspaceMember />
    <WorkspaceInviteUserModal {data} />

    <UploadPicModal {data} />
    <ChangePassCodeModal {data} />
    <ChangeEmailCodeModal {data} />
    <DeleteAccountConfirmationModal {data} />

    <MaterialApp>
      <AppBar fixed class='maxmins-w-100p has-background-primary px-3 is-align-items-center'>
        <div slot="icon">
          <Button on:click={toggleNavigation} icon outlined class="is-hidden-mobile has-text-white">
            <Icon class='white-text' path={!active ? mdiMenu : mdiChevronLeft} />
          </Button>
      
          <Button on:click={toggleNavigation} icon outlined class='is-hidden-tablet has-text-primary'>
            <Avatar>
              <img src="/images/axionFinalLogo.png" alt="Axion logo">
            </Avatar>
          </Button>
        </div>
        
        <!-- title -->
        <span slot="title" class="is-hidden-mobile is-unselectable fredokaone is-size-5 has-text-white">
          Axion
        </span>
  
        <!-- Expansion-er -->
        <div class="is-flex-grow-1"/>
  
        <!-- invitations inbox -->
        {#if data.user.verified}
          <Badge
            dot
            active={data.invitations.filter(invitation => invitation.to.id === data.user.id ).length > 0}
            class="success-color"
            offsetX={23}
            offsetY={innerWidth < 426 ? 13 : 10}
          >
            <a
              data-sveltekit-preload-data="hover"
              data-sveltekit-preload-code='eager'
              disabled={$page.url.pathname === `/${data.user.email}/invitations`}
              on:click={() => {
                if($page.url.pathname === `/${data.user.email}/invitations`) return
                loadingScreen.set(true)
              }}
              href="/{data.user.email}/invitations">
              <Button
                icon
                class="mr-3 has-background-grey-{$invModalActive? 'dark': ''} p-2 is-flex is-justify-content-center is-align-items-center"
              >
                <Icon class='white-text' size={innerWidth < 426 ? '20px': '30px'} path={mdiAccountGroup} />
              </Button>
            </a>
          </Badge>
        {/if}
  
        <!-- notification -->
        <div
            use:ClickOutside
            on:clickOutside={() => notifCenterOpen.set(false)}
          >
            <Badge
              dot
              active={data.notifications.filter(notification => notification.isRead != true).length > 0}
              class="success-color"
              offsetX={23}
              offsetY={13}
            >
              <Button
                icon
                on:click={() => {
                  notifCenterOpen.set(!$notifCenterOpen)
                }}
                class="mr-3 has-background-grey-{$notifCenterOpen? 'dark': ''} p-2 is-flex is-justify-content-center is-align-items-center"
              >
                <Icon class='white-text' size={innerWidth < 426 ? '20px': '30px'} path={mdiBell } />
              </Button>
            </Badge>
            <NotificationCenter {data} notifications={data.notifications} notifFromPic={data.notifFromPic} />
          </div>
  
          <!-- profile -->
          <div
            use:ClickOutside
            on:clickOutside={() => showProfileMenu = false}
          >
            <!-- Account Button -->
            <!-- {!$sidebarActive?"is-hidden":""} -->
            <Button
              icon
              class="is-hidden-touch" 
              on:click={() => {
                helpers.resetPanels()
                showProfileMenu = !showProfileMenu
              }}
            >
              {#if data.user.profile}
                <Avatar size='30px' class='maxmins-w-30 maxmins-h-30 has-background-white-bis'>
                  <img src={data.user.profile} alt={`${data.user.firstName} ${data.user.lastName}`}>
                </Avatar>
              {:else}
                <Icon class="white-text" size='30px' path={mdiAccount}/>
              {/if}
            </Button>
      
            <div
              style='transform-origin: top center' class="pos-abs pos-t-65 pos-r-5 has-background-white-bis elevation-3 rounded-b maxmins-w-200 z-100 has-transition rot-x-{showProfileMenu ? '0' : '90'}">
              <List nav>
                <a
                  data-sveltekit-preload-data="hover"
                  data-sveltekit-preload-code='eager'
                  href="/{data.user.email}/my-profile"
                  disabled={$page.url.pathname === `/${data.user.email}/my-profile`}
                  on:click={() => {
                    showProfileMenu = false
                    if($currentIndex == 3) return
                    loadingScreen.set(true)
                    currentIndex.set(3)
                  }}
                >
                  <ListItem
                    disabled={$page.url.pathname === `/${data.user.email}/my-profile`}
                    active={$page.url.pathname === `/${data.user.email}/my-profile`}
                  >
                    <span slot="prepend">
                      <Icon path={mdiTune} />
                    </span>
                    <span class="fredoka-reg">
                      My profile
                    </span>
                  </ListItem>
                </a>
                
                <!-- logoutModalActive.set(true) -->
                <ListItem on:click={logout}>
                  <span slot="prepend">
                    <Icon path={mdiLogoutVariant} />
                  </span>
                  <span class="fredoka-reg">
                    Logout
                  </span>
                </ListItem>
              </List>
            </div>
          </div>
      </AppBar>
  
      <NavigationDrawer width={innerWidth < 571 ? '100%' : '250px'} fixed clipped active mini={!active} miniWidth={innerWidth < 571 && !active? "0px": "68px"} class='has-background-white'>
        <List>
          <ListItemGroup mandatory>
            {#each navs as navItem, i}
              {#if navItem.name === "My Profile" || navItem.name === 'Logout'}
                <Divider class="is-hidden-desktop p-0 m-0 my-1" />
              {/if}
              <a
                data-sveltekit-preload-data="hover"
                data-sveltekit-preload-code='eager'
                href="{navItem.href}"
                on:click={() => {
                  helpers.resetPanels()
                  if($currentIndex == i) return
                  loadingScreen.set(true)
                  navClicked(i)
                }}
                disabled={$currentIndex == i}
              >
                <ListItem
                  active={$currentIndex == i}
                  disabled={$currentIndex == i}
                  class="has-text-{$currentIndex == i ? '' : 'asdf'}{color} has-background-{$currentIndex == i ? '' : 'asdf'}{color}-light {$currentIndex == i && color === 'yellow-text text-darken-2' ? `yellow-text text-darken-2 yellow lighten-4` : $currentIndex == i ? color : ''} {navItem.name === "My Profile" || navItem.name === 'Logout' ?"is-hidden-desktop":""}"
                >
                  <span slot="prepend">
                    <!-- {#if navItem.name === 'My Profile' && $userData.profile} -->
                    {#if navItem.name === 'My Profile' && data.user.profile !== ''}
                      <Avatar size='35px' class='maxmins-w-35 maxmins-h-35 {!active ? 'mb-0' : 'mr-7'}'>
                        <img src="{data.user.profile}" alt="Axion logo">
                      </Avatar>
                      <div class="txt-size-9 pb-4 {!active ? '' : 'is-hidden'}">
                        Profile
                      </div>
                    {:else}
                      <Icon class='has-text-{$currentIndex == i ? '' : 'asdf'}{color} {$currentIndex == i ? '' : 'asdf'}{color}' size="35px" path={navItem.icon} />
                      <div class="txt-size-9 pb-2 {!active ? '' : 'is-hidden'}">
                        {navItem.name === 'Assigned to me' ? 'Assigned' : navItem.name}
                      </div>
                    {/if}
                  </span>
                  <span class="fredoka-reg font-weight-semibold {navItem.name === 'My Profile' ? 'ml-1' : ''}">
                    {navItem.name}
                  </span>
                </ListItem>
              </a>
            {/each}
          </ListItemGroup>
        </List>
      </NavigationDrawer>
  
      <Overlay {active} on:click={toggleNavigation} index={1} />
      <Overlay opacity={1} bind:active={$loadingScreen} index={3} color='white'>
        <div class='maxmins-w-100p centerxy has-background-white'>
          <Pulse size={100} color='#13134e' />
        </div>
      </Overlay>
  
      <div class="hero is-fullheight pl-{innerWidth < 571 ? '' : '16'} pt-14">
        <!-- HEAD BREADCRUMBS -->
        <div class="hero-head z-{$addSubjectPanelActive || $subjectSettingsPanelActive || $confirmDeleteModalActive || $addWorkspacePanelActive || $workspaceSettingsPanelActive || $confirmDeleteWorkspaceModalActive || $addTaskPanelActive || $taskSettingsPanelActive || $taskConfirmDeleteModalActive || $navDrawerActive || $notifCenterOpen || $addBoardPanelActive || $boardSettingsPanelActive || $deleteBoardConfirmationModalActive ? '1' : '2'}">
          <div class="is-flex is-align-items-center {breadcrumbs[0].text === 'My profile' || breadcrumbs[0].text === 'Assigned to me' || breadcrumbs[0].text === 'Favorites' || breadcrumbs[0].text === 'Subjects' ? 'pl-3' : ''}">
            {#if innerWidth < 571}
              <a
                data-sveltekit-preload-data="hover"
                data-sveltekit-preload-code='eager'
                on:click={() => loadingScreen.set(true)}
                href='{breadcrumbs.length > 1 ? `${breadcrumbs[breadcrumbs[breadcrumbs.length-1].text === 'view' || breadcrumbs[breadcrumbs.length-1].text === 'members' || breadcrumbs[breadcrumbs.length-1].text === 'manage members' ? 2 : 1].href}` : `${breadcrumbs[0].href}`}'>
                <Button 
                  icon
                  class='{breadcrumbs[0].text === 'My profile' || breadcrumbs[0].text === 'Assigned to me' || breadcrumbs[0].text === 'Favorites' || breadcrumbs[0].text === 'Subjects' || breadcrumbs[0].text === 'Invitations' ? 'opacity-0p' : ''}'
                >
                  <Icon path={mdiChevronLeft} />
                </Button>
              </a>
              <a
                data-sveltekit-preload-data="hover"
                data-sveltekit-preload-code='eager'
                on:click={() => loadingScreen.set(true)}
                href='{$breadCrumbsItems[$breadCrumbsItems.length - 1].href}'
                class="txt-size-{innerWidth < 426 ? '12' : '18'} fredoka-reg {$breadCrumbsItems[$breadCrumbsItems.length-1].text === 'Subjects' || $breadCrumbsItems[$breadCrumbsItems.length-1].text === 'Assigned to me' || $breadCrumbsItems[$breadCrumbsItems.length - 1].text === 'Favorites' || $breadCrumbsItems[$breadCrumbsItems.length - 1].text === 'My profile'  || $breadCrumbsItems[$breadCrumbsItems.length - 1].text === 'boards' || $breadCrumbsItems[$breadCrumbsItems.length - 1].text === 'view' || $breadCrumbsItems[$breadCrumbsItems.length - 1].text === 'Invitations' ? 'has-text-grey' : 'is-underlined has-text-link is-clickable'}"
              >
                {$breadCrumbsItems[$breadCrumbsItems.length - 1].text}
              </a>
            {:else}
              <a
                data-sveltekit-preload-data="hover"
                data-sveltekit-preload-code='eager'
                on:click={() => loadingScreen.set(true)}
                href='{breadcrumbs.length > 1 ? `${breadcrumbs[breadcrumbs[breadcrumbs.length-1].text === 'view' || breadcrumbs[breadcrumbs.length-1].text === 'members' || breadcrumbs[breadcrumbs.length-1].text === 'manage members' ? 2 : 1].href}` : `${breadcrumbs[0].href}`}'>
                <Button
                  icon
                  class='{breadcrumbs[0].text === 'My profile' || breadcrumbs[0].text === 'Assigned to me' || breadcrumbs[0].text === 'Favorites' || breadcrumbs[0].text === 'Subjects' || breadcrumbs[0].text === 'Invitations' ? 'opacity-0p' : ''}'
                >
                  <Icon path={mdiChevronLeft} />
                </Button>
              </a>
              {#each breadcrumbs as crumb, i}
                <a
                  data-sveltekit-preload-data="hover"
                  data-sveltekit-preload-code='eager'
                  on:click={() => loadingScreen.set(true)}
                  href='{crumb.href}'
                  class="txt-size-{innerWidth < 426 ? '12' : '18'} fredoka-reg {crumb.text === 'Subjects' || crumb.text === 'Assigned to me' || crumb.text === 'Favorites' || crumb.text === 'My profile'  || crumb.text === 'boards' || crumb.text === 'view' || crumb.text === 'Invitations' ? 'has-text-grey' : 'is-underlined has-text-link is-clickable'}"
                >
                  {crumb.text}
                </a>
                {#if breadcrumbs.length > 1 && crumb.text !== 'boards' && crumb.text !== 'view' && crumb.text !== 'members' && crumb.text !== 'manage members'}
                  <Icon path={mdiChevronRight} />
                {/if}
              {/each}
            {/if}
          </div>
        </div>
  
        <!-- CONTENT HERE -->
        <div class="flex-grow-1 p-0 pl-3 pt-3 pr-3" style="overflow-x: hidden; overflow-y: clip">
          <slot />
        </div>
  
        <!-- FOOTER -->
        {#if removeHint || !data.user.footerHints}
          <div class="hero-foot pl-3 pb-3 {innerWidth < 571 ? 'has-background-primary-dark2' : ''}">
            <div class="level">
              <div class="level-left">
                <!-- logo -->
                <div class="level-item is-flex is-align-items-center is-justify-content-center">
                  <img class="maxmins-w-20 maxmins-h-20" src="/images/axionFinalLogo.png" alt="Axion logo">
                  <!-- name -->
                  <div class="fredoka-reg txt-size-14 ml-2">
                    Axion v2.0 2022
                  </div>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <div class="hero-foot p-3">
            {#if hint}  
              <div class="tags has-addons">
                <span class="tag is-dark fredoka-reg txt-size-18 {innerWidth < 571 ? 'is-hidden' : ''}">Hint</span>
                <span class="fredoka-reg {innerWidth < 571 ? 'txt-size-13 notification' : 'txt-size-18 tag'} is-success is-light">
                  {$hintText}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <span on:click={hideHint} class="{innerWidth < 571 ? '' : 'is-hidden'} delete is-clickable"/>
                </span>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <span on:click={hideHint} class="tag {innerWidth < 571 ? 'is-hidden' : ''} is-delete is-clickable has-background-danger-light has-text-danger-dark"/>
              </div>
            {:else}
              <Button
                on:click={() => hint = true }
                text size='{innerWidth < 426 ? 'x-small' : 'small'}' class='has-background-success-light fredoka-reg'>
                Click here to enable hints
              </Button>
  
              <Button
                on:click={() => removeHint = true}
                text size='{innerWidth < 426 ? 'x-small' : 'small'}' class='has-background-danger-light fredoka-reg'>
                Remove
              </Button>
            {/if}
          </div>
        {/if}
      </div>

    </MaterialApp>
  </div>
  {/if}

  {#if $currentIndex == 0 && $breadCrumbsItems[$breadCrumbsItems.length-1].text !== 'view' && $breadCrumbsItems[$breadCrumbsItems.length-1].text !== 'members' && $breadCrumbsItems[$breadCrumbsItems.length-1].text !== 'manage members' && $currentIndex !== 3 }
    <div class="z-90">
      <Fab {data} />
    </div>
  {/if}