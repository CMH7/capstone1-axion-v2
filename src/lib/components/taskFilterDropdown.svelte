<script>
  // @ts-nocheck
  import { selectedBoard, showFilter } from "$lib/stores/boards.store";
	import { mdiMinus } from "@mdi/js";
	import { ClickOutside, Divider, Icon } from "svelte-materialify";

  /** @type {import('@prisma/client').boards}*/
  export let board

  const sorts = [
    {
      prop: 'task name',
      sortTo: [
        {
        type: 'A1',
        label: 'A-Z'
        },
        {
        type: 'A2',
        label: 'Z-A'
        }
      ]
    },
    {
      prop: 'task level',
      sortTo: [
        {
        type: 'A3',
        label: 'High-Low'
        },
        {
        type: 'A4',
        label: 'Low-High'
        }
      ]
    },
    {
      prop: 'task due',
      sortTo: [
        {
        type: 'A5',
        label: 'Overdue-before due'
        },
        {
        type: 'A6',
        label: 'before due-Overdue'
        }
      ]
    }
  ]

  const changeFilter = () => {
    showFilter.set(false)
    console.log('Changed Filter!');
  }
</script>

<div
  use:ClickOutside
  on:clickOutside={() => showFilter.set(false)}
  style='transform-origin: top center'
  class="pos-abs pos-t-25 pos-r-0 has-transition maxmins-w-200 has-background-white-bis rounded py-1 px-1 mt-3 has-transition z-50 {$showFilter && $selectedBoard.id === board.id ? 'rot-x-0' : 'rot-x-90'}"
>
  <div class="fredoka-reg txt-size-10 pl-1">
    Sort
  </div>
  <Divider class='p-0 m-0 mb-2' />

  {#each sorts as asort}
  <!-- By task name -->
  <div>
    <div class="inter-reg txt-size-12 pl-1">
      By {asort.prop}
    </div>

    {#each asort.sortTo as filt}
      <!-- A to Z -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        on:click={changeFilter}
        class="is-flex is-align-items-center hover-bg-grey-lighter has-transition rounded is-clickable">
        <!-- check icon -->
        <div class="is-flex is-justify-content-center is-align-items-center maxmins-w-20p">
          <Icon size='13px' path={mdiMinus} />
        </div>
        <!-- type -->
        <div class="fredoka-reg txt-size-15">
          {filt.label}
        </div>
      </div>
      {/each}
    </div>
  {/each}
  
  <!-- Filter -->
  <div class="fredoka-reg txt-size-10 pl-1 mt-3">
    Filter
  </div>
  <Divider class='p-0 m-0 mb-2' />

  <!-- By task level -->
  <div class="mt-3">
    <div class="inter-reg txt-size-12 pl-1">
      By Task level/priority
    </div>

    <!-- Highest -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      on:click={changeFilter}
      class="is-flex is-align-items-center hover-bg-grey-lighter has-transition rounded is-clickable"
    >
      <!-- check icon -->
      <div class="is-flex is-justify-content-center is-align-items-center maxmins-w-20p">
        <Icon size='13px' path={mdiMinus} />
      </div>
      <!-- type -->
      <div class="fredoka-reg txt-size-15">
        Highest
      </div>
    </div>

    <!-- Medium -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      on:click={changeFilter}
      class="is-flex is-align-items-center hover-bg-grey-lighter has-transition rounded is-clickable"
    >
      <!-- check icon -->
      <div class="is-flex is-justify-content-center is-align-items-center maxmins-w-20p">
        <Icon size='13px' path={mdiMinus} />
      </div>
      <!-- type -->
      <div class="fredoka-reg txt-size-15">
        Medium
      </div>
    </div>
    
    <!-- Lowest -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      on:click={changeFilter}
      class="is-flex is-align-items-center hover-bg-grey-lighter has-transition rounded is-clickable"
    >
      <!-- check icon -->
      <div class="is-flex is-justify-content-center is-align-items-center maxmins-w-20p">
        <Icon size='13px' path={mdiMinus} />
      </div>
      <!-- type -->
      <div class="fredoka-reg txt-size-15">
        Lowest
      </div>
    </div>
  </div>

  <Divider class='p-0 m-0' />
  <div class="fredoka-reg txt-size-10 pl-1 mt-3 is-italic">
    Touch outside to close filter
  </div>
</div>