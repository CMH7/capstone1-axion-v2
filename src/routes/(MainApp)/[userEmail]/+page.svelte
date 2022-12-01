<script>
  // @ts-nocheck
	import { breadCrumbsItems, global_USERID, hintText } from '$lib/stores/global.store';
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { onMount } from 'svelte';
	import models from '$lib/models';
	import { addSubjectPanelActive } from '$lib/stores/subject.store';
	import SubjectBox from '$lib/components/subject/subjectBox.svelte';
	import SubjectBoxPreview from '$lib/components/subject/subjectBoxPreview.svelte';
	import { addWorkspacePanelActive, workspaceSettingsPanelActive } from '$lib/stores/workspace.store';
	import { addTaskPanelActive, taskSettingsPanelActive } from '$lib/stores/task.store';
	import { addBoardPanelActive, boardSettingsPanelActive } from '$lib/stores/boards.store';

  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth

  onMount(() => {
    activeSubject.set(models.subject)
    activeWorkspace.set(models.workspace)
    addWorkspacePanelActive.set(false)
    $breadCrumbsItems = [{text: 'Subjects', href: '#'}]
    hintText.set('Click the \'+\' icon to add new subject!')
    global_USERID.set(data.user.id)
    addWorkspacePanelActive.set(false)
    addTaskPanelActive.set(false)
    addBoardPanelActive.set(false)
    workspaceSettingsPanelActive.set(false)
    taskSettingsPanelActive.set(false)
    boardSettingsPanelActive.set(false)
  })
</script>

<svelte:window bind:innerWidth />
<svelte:head>
  <title>Subjects</title>
</svelte:head>

<div class="maxmins-w-100p is-flex is-flex-wrap-wrap {innerWidth < 571 ? "is-justify-content-center": "pl-3"}">
  <!-- Other Subjects -->
  {#if data.subjects.length == 0}
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
    {#each data.subjects as subject}
      <SubjectBox {data} {subject} />
    {/each}
    {#if $addSubjectPanelActive && innerWidth > 570}
      <SubjectBoxPreview />
    {/if}
  {/if}
</div>
