<script>
  //@ts-nocheck
	import { goto } from '$app/navigation';
	import NothingFound from '$lib/components/nothingFound.svelte';
	import UserBox from '$lib/components/workspace/userBox.svelte';
	import helpers from '$lib/configs/helpers';
  import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems, global_USERID, hintText, loadingScreen, notifs } from '$lib/stores/global.store';
	import { mdiMagnify } from '@mdi/js';
	import bcryptjs from 'bcryptjs';
	import { onMount } from 'svelte';
	import { Checkbox, Icon, MaterialApp, TextField } from 'svelte-materialify';


  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth = 0
  let showMembers = true
  let hideOthers = false
  let searchFor = ''
  let members = []

  $: update(data)
  $: update = (data) => {
    if(!showMembers && !hideOthers) {
      members = data.otherUsers
    } else if(!showMembers && hideOthers) {
      members = []
    } else if (showMembers && !hideOthers) {
      members = [...data.members, ...data.otherUsers]
    } else if (showMembers && hideOthers) {
      members = data.members
    }

    if(searchFor !== '') {
      members = members.filter(m => `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().match(searchFor.toLowerCase()))
    } else {
      if(!showMembers && !hideOthers) {
        members = data.otherUsers
      } else if(!showMembers && hideOthers) {
        members = []
      } else if (showMembers && !hideOthers) {
        members = [...data.members, ...data.otherUsers]
      } else if (showMembers && hideOthers) {
        members = data.members
      }
    }
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
    $breadCrumbsItems = [{text: $activeSubject.name, href: `/${data.user.email}/`}, {text: $activeWorkspace.name, href: `/${data.user.email}/${$activeSubject.id}`}, {text: 'manage members', href: `/${data.user.email}/${$activeSubject.id}/${$activeWorkspace.id}`}]
    hintText.set('Click the \'+\' to create task and more tools!')
    global_USERID.set(data.user.id)
    loadingScreen.set(false)
    helpers.resetPanels()
  })
</script>

<svelte:window bind:innerWidth />

<div class="columns is-mobile is-multiline overflow-x-auto {innerWidth < 571 ? '' : 'pl-3 pt-3'} mb-6">
  <div class="column is-12">
    <div class="maxmins-w-100p is-flex is-flex-wrap-wrap is-align-items-center">
      <div class='maxmins-w-{innerWidth < 571 ? '100p' : '400'} mr-3'>
        <MaterialApp>
          <TextField bind:value={searchFor} color='grey' outlined dense class='fredoka-reg'>
            Search name or email
            <div slot='append' class="is-clickable">
              <Icon path={mdiMagnify} />
            </div>
          </TextField>
        </MaterialApp>
      </div>

      <div class='mr-3 {innerWidth < 571 ? 'mt-3' : ''}'>
        <Checkbox color='green' bind:checked={showMembers} >
          <div class="fredoka-reg has-text-grey">
            Show members
          </div>
        </Checkbox>
      </div>
      
      <div class=' {innerWidth < 571 ? 'mt-3' : ''}'>
        <Checkbox color='green' bind:checked={hideOthers} >
          <div class="fredoka-reg has-text-grey">
            Hide others
          </div>
        </Checkbox>
      </div>
    </div>
  </div>
  {#if members.length != 0}
  {#each members as member}
    <UserBox {data} {member} />
  {/each}
  {:else}
    <NothingFound />
  {/if}
</div>