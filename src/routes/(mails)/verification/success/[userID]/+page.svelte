<script>
  //@ts-nocheck
  import { Avatar, Icon } from 'svelte-materialify'
  import { mdiCheck } from '@mdi/js'
	import { onMount } from 'svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';

  /**
   * @type {import('./$types').PageServerData}
   */
  export let data

  let rotx = 0
  let forwards= true
  let innerWidth = 0
  let loading = true

  onMount(() => {
    loading = false
    setInterval(() => {
      if(rotx == 720) forwards = false
      if(rotx == -1) forwards = true
      if(forwards) rotx++
      if(!forwards) rotx--
    }, 50)
  })
</script>

<svelte:window bind:innerWidth />

{#if !loading}
  <div class="hero-body">
    <div class="maxmins-w-100p centerxy">
      <div class="is-flex is-flex-direction-column is-align-items-center">
        <Avatar size='{innerWidth < 571 ? '27' : '8'}vw' class='has-background-primary centerxy is-relative'>
          <Icon class='has-text-grey-lighter z-1' path={mdiCheck} />
          <img style='filter: blur(12px)' class="pos-abs pos-t-0 pos-l-0 rot-z-{rotx}" src="/images/axionFinalLogo.png" alt="Axion logo">
        </Avatar>
        <div class="fredoka-reg txt-size-{innerWidth < 571 ? '2rem' : '4rem'} has-text-centered maxmins-w-100p">
          {data.msg}
        </div>
        <div class="txt-size-15 fredoka-reg has-text-centered ">
          you are now capable of collaborating with the other users nearby!
        </div>
        <div class="txt-size-15 fredoka-reg has-text-centered ">
          You can safely close this window or tab
        </div>
      </div>
    </div>
  </div>
{:else}
  <LoadingScreen />
{/if}