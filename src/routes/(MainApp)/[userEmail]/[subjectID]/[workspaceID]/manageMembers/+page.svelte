<script>
  //@ts-nocheck
	import UserBox from '$lib/components/workspace/userBox.svelte';
	import helpers from '$lib/configs/helpers';
  import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems, global_USERID, hintText, loadingScreen } from '$lib/stores/global.store';
	import { mdiMagnify } from '@mdi/js';
	import { onMount } from 'svelte';
	import { Checkbox, Icon, MaterialApp, TextField } from 'svelte-materialify';


  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth = 0
  let showOnlyMembers = false
  let searchFor = ''

  $: members = !showOnlyMembers ? [...data.members, ...data.otherUsers] : data.members
  $: searchFor === '' ? members = !showOnlyMembers ? [...data.members, ...data.otherUsers] : data.members : members = members.filter(member => `${member.firstName}${member.lastName}${member.email}`.toLowerCase().match(searchFor.toLowerCase()))

  const keyDown = e => {
    if(e.keyCode == 8) members = !showOnlyMembers ? [...data.members, ...data.otherUsers] : data.members
  }

  onMount(() => {
    activeSubject.set(data.subject)
    activeWorkspace.set(data.workspace)
    $breadCrumbsItems = [{text: $activeSubject.name, href: `/${data.user.email}/`}, {text: $activeWorkspace.name, href: `/${data.user.email}/${$activeSubject.id}`}, {text: 'manage members', href: `/${data.user.email}/${$activeSubject.id}/${$activeWorkspace.id}`}]
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

      <div>
        <Checkbox color='green' bind:checked={showOnlyMembers} >
          <div class="fredoka-reg has-text-grey">
            Show only members
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
    <div class="fredoka-reg txt-size-15">
      We found nothing.
    </div>
  {/if}
</div>