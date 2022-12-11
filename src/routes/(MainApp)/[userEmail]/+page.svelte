<script>
  // @ts-nocheck
	import { breadCrumbsItems, currentIndex, global_USERID, hintText, loadingScreen, notifs } from '$lib/stores/global.store';
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { onMount } from 'svelte';
	import models from '$lib/models';
	import { addSubjectPanelActive } from '$lib/stores/subject.store';
	import SubjectBox from '$lib/components/subject/subjectBox.svelte';
	import SubjectBoxPreview from '$lib/components/subject/subjectBoxPreview.svelte';
	import helpers from '$lib/configs/helpers';
	import { Icon, TextField } from 'svelte-materialify';
	import { mdiMagnify } from '@mdi/js';
  import bcryptjs from 'bcryptjs'
	import { goto } from '$app/navigation';

  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth
  let searchFor = ''

  $: clientSubjects = data.subjects
  $: searchFor !== '' ? clientSubjects = clientSubjects.filter(cs => cs.name.toLowerCase().match(searchFor.toLowerCase())) : clientSubjects = data.subjects

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
    currentIndex.set(0)
    activeSubject.set(models.subject)
    activeWorkspace.set(models.workspace)
    $breadCrumbsItems = [{text: 'Subjects', href: '#'}]
    hintText.set('Click the \'+\' icon to add new subject!')
    global_USERID.set(data.user.id)
    loadingScreen.set(false)
    helpers.resetPanels()
  })
</script>

<svelte:window bind:innerWidth />
<svelte:head>
  <title>Subjects</title>
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
  {#if clientSubjects.length == 0}
    {#if !$addSubjectPanelActive && innerWidth > 570}
      <div class="section">
        <div class="container">
          <p>
            No subjects
          </p>
        </div>
      </div>
    {:else if $addSubjectPanelActive && innerWidth > 570}
      <SubjectBoxPreview />
    {:else}
      <div class="section">
        <div class="container">
          <p>
            No subjects
          </p>
        </div>
      </div>
    {/if}
  {:else}
    {#each clientSubjects as subject}
      <SubjectBox {data} {subject} />
    {/each}
    {#if $addSubjectPanelActive && innerWidth > 570}
      <SubjectBoxPreview />
    {/if}
  {/if}
</div>
