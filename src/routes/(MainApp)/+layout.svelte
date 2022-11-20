<script>
  //@ts-nocheck
  import { ClickOutside, AppBar, Icon, NavigationDrawer, Overlay, Button, MaterialApp, Avatar, List, ListItem, ListItemGroup, Divider, Badge } from 'svelte-materialify'
  import {mdiBell, mdiViewDashboard, mdiAccountCheck, mdiTune, mdiStar, mdiAccount, mdiLogoutVariant, mdiMenu, mdiChevronLeft, mdiChevronRight, mdiAccountGroup } from '@mdi/js';
	import { goto } from '$app/navigation';
	import { breadCrumbsItems, hintText, loading, notifCenterOpen } from '$lib/stores/global.store';
	import { activeSubject, invModalActive } from '$lib/stores/dashboard.store';
	import { page } from '$app/stores';
	import NotificationCenter from '$lib/components/User-Notification-Center/NotificationCenter.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import { fade } from 'svelte/transition'
	import NotificationContainer from '$lib/components/System-Notification/Notification-container.svelte';
	import Fab from '$lib/components/fab/fab.svelte';

  /** @type {import('./$types').LayoutServerData} */
  export let data

  let active = false
  let innerWidth = 0
  let currentIndex = 0
  let showProfileMenu = false
  let breadcrumbs = []
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

  const toggleNavigation = () => {
    active = !active
  }

  const navClicked = async (i, href) => {
    if(i == 0) breadcrumbs = [{text: 'Subjects', href: `/${data.user.email}`}]
    if(i == 1) breadcrumbs = [{text: 'Assigned to me', href: `/${data.user.email}/assigned-to-me`}]
    if(i == 2) breadcrumbs = [{text: 'Favorites', href: `/${data.user.email}/favorites`}]
    if(i == 3) breadcrumbs = [{text: 'My profile', href: `/${data.user.email}/my-profile`}]
    if(i == 4) {
      logout()
      return
    }
    currentIndex = i
    await goto(href, {replaceState: true})
  }

  const crumbClicked = async crumb => {
    if(crumb.text === $activeSubject.name) {
      $breadCrumbsItems = [{text: 'Subjects', href: '#'}]
    }
    await goto(crumb.href, {replaceState: true})
  }

  const logout = () => {
    let form = document.getElementById('form')
    form.submit()
  }

  const hideHint = () => {
    hint = false
  }
</script>

<svelte:window bind:innerWidth />


{#if $loading}
<LoadingScreen />
{:else}
  <div in:fade>
    <NotificationContainer />
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
            <Button
              icon
              on:click={e => {
                invModalActive.set(true)
              }}
              class="mr-3 has-background-grey-{$invModalActive? 'dark': ''} p-2 is-flex is-justify-content-center is-align-items-center"
            >
              <Icon class='white-text' size={innerWidth < 426 ? '20px': '30px'} path={mdiAccountGroup} />
            </Button>
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
            <NotificationCenter notifications={data.notifications} notifFromPic={data.notifFromPic} />
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
              class="is-hidden-touch has-transition p-2 rounded-circle" 
              on:click={() => {
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
                <ListItem
                  on:click={async () => {
                    currentIndex = 3
                    showProfileMenu = false
                    await goto(`/${data.user.email}/my-profile`, {replaceState: true})
                  }}
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
  
                <!-- make this form hidden always -->
                <form id="form" method="POST" action="?/logout" class="is-hidden"></form>
                
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
  
      <NavigationDrawer fixed clipped active mini={!active} miniWidth={innerWidth < 571 && !active? "0px": "68px"} class='has-background-white'>
        <List>
          <ListItemGroup mandatory class='has-text-{navs[currentIndex].color} {navs[currentIndex].color}'>
            {#each navs as navItem, i}
              {#if navItem.name === "My Profile" || navItem.name === 'Logout'}
                <Divider class="is-hidden-desktop p-0 m-0 my-1" />
              {/if}
              <ListItem
                active={currentIndex == i}
                disabled={currentIndex == i}
                class="{navItem.name === "My Profile" || navItem.name === 'Logout' ?"is-hidden-desktop":""}"
                on:click={() => {navClicked(i, navItem.href)}}
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
                    <Icon size="35px" path={navItem.icon} />
                    <div class="txt-size-9 pb-2 {!active ? '' : 'is-hidden'}">
                      {navItem.name === 'Assigned to me' ? 'Assigned' : navItem.name}
                    </div>
                  {/if}
                </span>
                <span class="fredoka-reg font-weight-semibold {navItem.name === 'My Profile' ? 'ml-1' : ''}">
                  {navItem.name}
                </span>
              </ListItem>
            {/each}
          </ListItemGroup>
        </List>
      </NavigationDrawer>
  
      <Overlay active={active || $notifCenterOpen} absolute on:click={toggleNavigation} index={1} />
  
      <div class="hero is-fullheight pl-{innerWidth < 571 ? '' : '16'} pt-14">
        <!-- HEAD BREADCRUMBS -->
        <div class="hero-head pl-3">
          <div class="is-flex is-align-items-center">
            {#each breadcrumbs as crumb}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <div
                on:click={e => crumbClicked(crumb)}
                class="txt-size-{innerWidth < 426 ? '13' : '20'} fredoka-reg {crumb.text === 'Subjects' || crumb.text === 'Assigned to me' || crumb.text === 'Favorites' || crumb.text === 'My profile'  || crumb.text === 'boards' ? 'has-text-grey' : 'is-underlined has-text-link is-clickable'}">
                {crumb.text}
              </div>
              {#if breadcrumbs.length > 1 && crumb.text !== 'boards'}
                <Icon path={mdiChevronRight} />
              {/if}
            {/each}
          </div>
        </div>
  
        <!-- CONTENT HERE -->
        <div class="flex-grow-1 p-0 pl-3 pt-3 pr-3" style="overflow-x: hidden; overflow-y: clip">
          <slot />
        </div>
  
        <!-- FOOTER -->
        {#if removeHint}
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
  {#if currentIndex == 0 }
    <div class="z-90">
      <Fab {data} />
    </div>
  {/if}


