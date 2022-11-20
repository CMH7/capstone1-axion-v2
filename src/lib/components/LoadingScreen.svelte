<script>
  import { fade } from 'svelte/transition';
  import { Pulse } from 'svelte-loading-spinners';
</script>

<div out:fade class="hero is-fullheight is-primary pos-fix maxmins-w-100v">
  <div class="hero-body is-flex is-justify-content-center is-align-items-center z-100">
    <Pulse
      size=130
      color="#fff"
    />
  </div>
</div>