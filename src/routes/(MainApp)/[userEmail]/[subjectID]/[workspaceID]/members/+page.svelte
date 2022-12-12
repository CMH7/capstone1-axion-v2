<script>
  //@ts-nocheck
	import { goto } from '$app/navigation';
	import helpers from '$lib/configs/helpers';
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems, global_USERID, hintText, loadingScreen, notifs } from '$lib/stores/global.store';
	import { mdiAccountOutline, mdiMagnify } from '@mdi/js';
	import bcryptjs from 'bcryptjs';
	import { onMount } from 'svelte';
	import { Card, CardSubtitle, CardTitle, Icon, MaterialApp, TextField } from 'svelte-materialify';


  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth = 0
  let searchFor = ''

  $: members = data.members
  $: searchFor === '' ? members = data.members : members = members.filter(member => `${member.firstName}${member.lastName}${member.email}`.toLowerCase().match(searchFor.toLowerCase()))

  const keyDown = e => {
    if(e.keyCode == 8) members = data.members
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
    activeSubject.set(data.subject)
    activeWorkspace.set(data.workspace)
    $breadCrumbsItems = [{text: $activeSubject.name, href: `/${data.user.email}/`}, {text: $activeWorkspace.name, href: `/${data.user.email}/${$activeSubject.id}`}, {text: 'members', href: `/${data.user.email}/${$activeSubject.id}/${$activeWorkspace.id}`}]
    hintText.set('Click the \'+\' to create task and more tools!')
    global_USERID.set(data.user.id)
    loadingScreen.set(false)
    helpers.resetPanels()
  })
</script>

<svelte:window bind:innerWidth on:keydown={keyDown} />

<div class="columns is-mobile is-multiline overflow-x-auto {innerWidth < 571 ? '' : 'pl-3 pt-3'} mb-6">
  <div class="column is-12">
    <div class="maxmins-w-100p is-flex is-flex-wrap-wrap is-align-items-center">
      <div class='maxmins-w-{innerWidth < 571 ? '100p' : '300'} mr-3'>
        <MaterialApp>
          <TextField bind:value={searchFor} color='grey' outlined dense class='fredoka-reg'>
            Search name or email
            <div slot='append' class="is-clickable">
              <Icon path={mdiMagnify} />
            </div>
          </TextField>
        </MaterialApp>
      </div>
    </div>
  </div>
  {#each members as member}
    <div class="column is-2-desktop is-4-tablet is-12-mobile">
      <Card class='is-relative'>
        <div class="pos-abs pos-l-0 pos-t-0 maxmins-w-100p">
          <div class='maxmins-w-100p is-flex is-align-items-center is-justify-content-flex-end py-1 px-2 has-background-white'>
            <div class='fredoka-reg txt-size-13 mr-2 has-text-{member.online ? 'success' : 'grey-light'}'>
              {member.online ? 'Online' : 'Offline'}
            </div>

            <div class='rounded-circle maxmins-w-13 maxmins-h-13 has-background-{member.online ? 'success' : 'grey-light'}' />
          </div>
        </div>

        {#if member.profile !== ''}
          <div class="maxmins-h-200" style='overflow: hidden;'>
            <img class="maxmins-w-100p" src='{member.profile}' alt='{member.firstName} {member.lastName}' />
          </div>
        {:else}
          <div class="is-flex is-justify-content-center maxmins-h-200">
            <Icon size='100%' class='{member.gender === 'Male' ? 'blue' : 'pink'}-text' path={mdiAccountOutline} />
          </div>
        {/if}
        
        <CardTitle>
          <div class='fredoka-reg maxmins-w-100p txt-overflow-ellipsis overflow-x-hidden'>
            {member.firstName} {member.lastName}
          </div>
        </CardTitle>
        <CardSubtitle>
          <div class='fredoka-reg maxmins-w-100p txt-overflow-ellipsis overflow-x-hidden'>
            {member.email}
          </div>
          <div class='is-italic fredoka-reg'>
            {data.workspace.admins.includes(member.id) ? data.workspace.owner === member.id ? 'owner' : 'admin' : 'Member'}
          </div>
        </CardSubtitle>
      </Card>
    </div>
  {/each}
</div>