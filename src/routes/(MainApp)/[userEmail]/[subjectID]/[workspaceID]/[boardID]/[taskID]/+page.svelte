<script>
	import favorites from '$lib/models/favorites';
import { activeBoard } from '$lib/stores/boards.store';
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems } from '$lib/stores/global.store';
	import { activeTask } from '$lib/stores/task.store';
	import { mdiAccountGroupOutline, mdiNumeric1, mdiStar, mdiStarOutline } from '@mdi/js';
	import { onMount } from 'svelte';
	import { Button, Icon } from 'svelte-materialify';


  //@ts-nocheck
  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth = 0

  onMount(() => {
    activeSubject.set(data.subject)
    activeWorkspace.set(data.workspace)
    activeBoard.set(data.board)
    activeTask.set(data.task)
    $breadCrumbsItems = [
      {text: data.subject.name, href: `/${data.user.email}`},
      {text: data.workspace.name, href: `/${data.user.email}/${data.subject.id}`},
      {text: data.board.name, href: `/${data.user.email}/${data.subject.id}/${data.workspace.id}`},
      {text: data.task.name, href: `/${data.user.email}/${data.subject.id}/${data.workspace.id}/${data.board.id}`},
      {text: 'view', href: '#'}
    ]
  })
</script>

<svelte:window bind:innerWidth />

<div class="columns is-mobile pl-3">
  <div class='column is-8-desktop is-6-tablet is-12-mobile'>

    <!-- name, level, favorite, subtasks count, people -->
    <div class="columns">
      <!-- name -->
      <div class="column is-6-tablet is-12-mobile isflex is-align-items-center">
        <div class="fredoka-reg txt-size-32 is-size-4-mobile is-flex is-align-items-center">
          {data.task.name}
        </div>
      </div>

      <!-- level -->
      <div class="column is-2-tablet is-3-mobile centerxy has-background-black">
        <div class="tags has-addons is-hidden-mobile">
          <div class="tag is-{data.task.level == 3 ? 'danger' : data.task.level == 2 ? 'warning' : 'success'}">
            Level
          </div>
          <div class="tag is-{data.task.level == 3 ? 'danger' : data.task.level == 2 ? 'warning' : 'success'} is-light">
            {data.task.level == 3 ? 'High' : data.task.level == 2 ? 'Medium' : 'Low'}
          </div>
        </div>

        <div class="is-hidden-tablet tag is-{data.task.level == 3 ? 'danger' : data.task.level == 2 ? 'warning' : 'success'}">
          {data.task.level == 3 ? 'High' : data.task.level == 2 ? 'Medium' : 'Low'}
        </div>
      </div>

      <!-- favorite -->
      <div class="column is-2-tablet is-3-mobile centerxy has-background-warning">
        <div class="tags has-addons is-hidden-mobile">
          <div class="tag is-dark">
            {#if data.user.favorites[2].ids.includes(data.task.id)}
              <Icon class='has-text-warning' path={mdiStar} />
              {:else}
              <Icon class='has-text-warning' path={mdiStarOutline} />
            {/if}
          </div>
          <div class="tag is-warning">
            {#if data.user.favorites[2].ids.includes(data.task.id)}
              Favorite
              {:else}
              Add favorite
            {/if}
          </div>
        </div>

        <div class="is-hidden-tablet tag is-light">
          {#if data.user.favorites[2].ids.includes(data.task.id)}
            <Icon class='has-text-warning' path={mdiStar} />
          {:else}
            <Icon class='has-text-warning' path={mdiStarOutline} />
          {/if}
        </div>
      </div>

      <!-- subtasks count -->
      <div class="column is-2-tablet is-3-mobile centerxy has-background-grey">
        <div class="tags has-addons is-hidden-mobile">
          <div class="tag is-info">
            Subtasks
          </div>
          <div class="tag is-info is-light">
            {data.task.subtasks.length}
          </div>
        </div>

        <div class="is-hidden-tablet tag is-info">
          {data.task.subtasks.length}
        </div>
      </div>

      <!-- more tools -->
      <div class="column is-3-mobile centerxy is-hidden-tablet has-background-danger">
        <div class="tags has-addons is-hidden-mobile">
          <div class="tag is-dark">
            Tools
          </div>
          <div class="tag is-{data.task.level == 3 ? 'danger' : data.task.level == 2 ? 'warning' : 'success'}">
            {data.task.level == 3 ? 'High' : data.task.level == 2 ? 'Medium' : 'Low'}
          </div>
        </div>

        <div class="is-hidden-tablet">
          <Icon path={mdiAccountGroupOutline} />
        </div>
      </div>
    </div>
  </div>

  <div class="column is-4-desktop is-6-tablet is-12-mobile has-background-warning-light">
    {#each data.members as member}
      <div>
        {member.email}
      </div>
    {/each}
  </div>
</div>