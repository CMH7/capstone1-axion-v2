<script>
  // @ts-nocheck
	import { breadCrumbsItems, currentIndex, global_USERID, hintText, loadingScreen, notifs } from '$lib/stores/global.store';
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { onMount } from 'svelte';
	import models from '$lib/models';
	import WorkspaceBox from '$lib/components/workspace/workspaceBox.svelte';
	import { addWorkspacePanelActive } from '$lib/stores/workspace.store';
	import WorkspaceBoxPreview from '$lib/components/workspace/workspaceBoxPreview.svelte';
	import { goto, invalidate } from '$app/navigation';
	import helpers from '$lib/configs/helpers';
	import { Icon, TextField } from 'svelte-materialify';
	import { mdiMagnify } from '@mdi/js';
	import bcryptjs from 'bcryptjs';
	import NothingFound from '$lib/components/nothingFound.svelte';

  /** 
   * @type {import('./$types').PageServerData}
   * */
  export let data

  let innerWidth = 0
  let searchFor = ''

  $: clientWorkspaces = data.workspaces
  $: searchFor !== '' ? clientWorkspaces = clientWorkspaces.filter(cw => cw.name.toLowerCase().match(searchFor.toLowerCase())) : clientWorkspaces = data.workspaces

  onMount(async () => {
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
    currentIndex.set(0)
    if(!data.aMember) {
      await invalidate(`/${data.user.email}`)
      goto(`/${data.user.email}`)
    }
    activeWorkspace.set(models.workspace)
    activeSubject.set(data.subject)
    $breadCrumbsItems = [{text: $activeSubject.name, href: `/${data.user.email}`}]
    hintText.set('Click the \'+\' icon to add new workspace and access to subject settings!')
    global_USERID.set(data.user.id)
    helpers.resetPanels()
    loadingScreen.set(false)
  })
</script>

<svelte:window bind:innerWidth />
<svelte:head>
  <title>{$activeSubject.name}</title>
</svelte:head>

<div class="maxmins-w-100p is-flex is-flex-wrap-wrap {innerWidth < 571 ? "is-justify-content-center": "pl-3"}">
  <div class='maxmins-w-100p mb-2'>
    <div class='maxmins-w-{innerWidth < 571 ? '100p' : '250'}'>
      <TextField dense outlined bind:value={searchFor}>
        Search
        <div slot='append'>
          <Icon path={mdiMagnify} />
        </div>
      </TextField>
    </div>
  </div>
  <!-- Other Subjects -->
  {#if clientWorkspaces.length == 0}
    {#if !$addWorkspacePanelActive && innerWidth > 570}
      <NothingFound />
    {:else if $addWorkspacePanelActive && innerWidth > 570}
      <WorkspaceBoxPreview />
    {:else}
      <NothingFound />
    {/if}
  {:else}
    {#each clientWorkspaces as workspace}
      <WorkspaceBox {data} {workspace} />
    {/each}
    {#if $addWorkspacePanelActive && innerWidth > 570}
      <WorkspaceBoxPreview />
    {/if}
  {/if}
</div>
