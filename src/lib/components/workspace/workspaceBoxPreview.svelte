<script>
  //@ts-nocheck
  import { fade } from 'svelte/transition'
  import { modalChosenColor } from '$lib/stores/global.store'
  import { Button, Icon } from 'svelte-materialify'
  import { mdiStar } from '@mdi/js'
	import { newWorkspaceName } from '$lib/stores/workspace.store';

  let innerWidth = 0

</script>

<svelte:window bind:innerWidth />

<div in:fade out:fade class="has-transition notification rounded maxmins-h-110 is-relative is-{$modalChosenColor} {$modalChosenColor === 'grey' ? `has-background-${$modalChosenColor}` : ''} maxmins-w-{innerWidth < 571 && innerWidth >= 473 ? '200' : '230'}">
  <div class="pos-abs pos-r-0 pos-t-0">
    <Button icon>
      <Icon class='has-text-{$modalChosenColor === 'warning' ? '' : 'warning'}' path={mdiStar} />
    </Button>
  </div>

  <!-- subject name -->
  <p class="is-unselectable txt-size-14 pos-abs pos-r-10 pos-b-10 max-w-{innerWidth < 571 && innerWidth > 473 ? '180' : '200'} txt-overflow-ellipsis overflow-x-hidden mb-0">
    {$newWorkspaceName}
  </p>
</div>