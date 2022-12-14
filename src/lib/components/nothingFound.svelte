<script>
  //@ts-nocheck
	import { mdiExclamationThick } from '@mdi/js';
  import { Icon } from 'svelte-materialify'

  let innerWidth = 0
</script>

<svelte:window bind:innerWidth />

<div class='maxmins-w-100p maxmins-h-500 centerxy'>
  <Icon size={innerWidth < 571 ? 50 : 100} class='grey-text text-lighten-2' path={mdiExclamationThick} />
  <div class='fredoka-reg txt-size-30 grey-text text-lighten-2'>
    Nothing found
  </div>
</div>