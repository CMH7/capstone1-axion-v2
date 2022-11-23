<script>
  // @ts-nocheck
  import { fade } from 'svelte/transition'
  import {Button, Icon} from 'svelte-materialify'
  import { mdiStar, mdiStarOutline } from '@mdi/js'
	import { breadCrumbsItems, hintText } from '$lib/stores/global.store';
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { onMount } from 'svelte';
	import models from '$lib/models';

  /** @type {import('./$types').PageServerData}*/
  export let data

  let mouseEnter = false
  let hovering = false
  let innerWidth

  onMount(() => {
    activeSubject.set(models.subject)
    activeWorkspace.set(models.workspace)
    $breadCrumbsItems = [{text: 'Subjects', href: '#'}]
    hintText.set('Click the \'+\' icon to add new subject!')
  })
</script>

<svelte:window bind:innerWidth />
<svelte:head>
  <title>Subjects</title>
</svelte:head>

<div class="maxmins-w-100p is-flex is-flex-wrap-wrap {innerWidth < 571 ? "is-justify-content-center": "pl-3"}">
  <!-- Other Subjects -->
  {#if data.subjects.length == 0}
    <div class="section">
      <div class="container">
        <p>
          No subjects
        </p>
      </div>
    </div>
  {:else}
    {#each data.subjects as subject}
      <div in:fade class="maxmins-w-{innerWidth < 571 && innerWidth >= 473 ? '200' : '230'} flex-shrink-0 mr-3 mb-3">
        <!-- SUBJECT BOX -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <a href='/{data.user.email}/{subject.id}'>
          <div
            on:mouseenter={() => mouseEnter = true}
            on:mouseleave={() => mouseEnter = false}
            class="has-transition notification rounded maxmins-h-110 is-relative {mouseEnter?`has-background-${subject.color}-dark`:""} is-{subject.color} is-clickable maxmins-w-{innerWidth < 571 && innerWidth >= 473 ? '200' : '230'}"
          >
            <div
              on:mouseenter={e => hovering = true}
              on:mouseleave={e => hovering = false}
              class="pos-abs pos-r-0 pos-t-0"
            >
              <Button
                icon
              >
                {#if subject.isFavorite}
                <Icon class='has-text-{subject.color === 'warning' ? '' : 'warning'}' path={hovering ? mdiStarOutline : mdiStar} />
                {:else}
                <Icon class='has-text-{subject.color === 'warning' ? '' : 'warning'}' path={hovering ? mdiStar : mdiStarOutline} />
                {/if}
              </Button>
            </div>
    
            <!-- subject name -->
            <p class="is-unselectable txt-size-14 pos-abs pos-r-10 pos-b-10 max-w-{innerWidth < 571 && innerWidth > 473 ? '180' : '200'} txt-overflow-ellipsis overflow-x-hidden mb-0">
              {subject.name}
            </p>
          </div>
        </a>
      </div>
    {/each}
  {/if}
</div>
