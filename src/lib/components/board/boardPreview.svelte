<script>
  //@ts-nocheck
  import { Button, Icon } from 'svelte-materialify'
  import { mdiFilter } from '@mdi/js'
	import { newBoardName } from "$lib/stores/boards.store";
	import { modalChosenColor } from "$lib/stores/global.store";
  import { fade } from 'svelte/transition'

</script>
<div in:fade out:fade class="column is-narrow">
  <div class="is-flex is-justify-content-center">
    <div class="notification pb-1 pt-2 maxmins-w-250 max-h-550 px-2 rounded elevation-3 has-background-{$modalChosenColor}-light">
      <!-- board header -->
      <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between mb-3">
        <!-- Board Title -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="fredoka-reg is-unselectable notification m-0 py-1 px-2 is-{$modalChosenColor} txt-size-14"
        >
          {$newBoardName}
        </div>

        <!-- task count and filter button -->
        <div class="is-flex is-align-items-center is-relative">

          <!-- Task Count Text -->
          <div class="fredoka-reg txt-size-12 is-unselectable">
            0 task
          </div>

          <!-- filter icon -->
          <Button
            icon
            class="ml-1 is-flex is-justify-content-center is-align-items-center has-transition"
          >
            <Icon size='18px' path={mdiFilter} />
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>