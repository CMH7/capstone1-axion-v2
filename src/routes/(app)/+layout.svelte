<script>
	//@ts-nocheck
	import '../../app.scss';
	import { onMount } from 'svelte'
	import { Icon } from 'svelte-materialify'
	import { mdiChevronUp } from '@mdi/js'
	import NotificationContainer from '$lib/components/System-Notification/Notification-container.svelte';

  const navbarEndLinks = [
    {label: 'Home', href: '/'},
    {label: 'About', href: '/About'},
    {label: 'Contact', href: '/Contact'},
    {label: 'Signin', href: '/Signin'}
  ]

  let menuActive = false
  let mouseEnteredNav = false
  let mouseEnteredFoot = false
  let mouseEnteredSignup = false
	let hidden = true
	let showOnPx = 150
  let innerWidth = 0

  onMount(() => {
    menuActive = false
    mouseEnteredNav = false
    mouseEnteredSignup = false
  })

	function goTop() {
    document.body.scrollIntoView();
  }

  function scrollContainer() {
    return document.documentElement || document.body;
  }

  function handleOnScroll() {
    if (!scrollContainer()) {
      return;
    }

    if (scrollContainer().scrollTop > showOnPx) {
      hidden = false;
    } else {
      hidden = true;
    }
  }
</script>

<svelte:window on:scroll={handleOnScroll} bind:innerWidth />

<style>
  .has-background-primary-dark2 {
    background-color: hsl(240, 100%, 10%);
  }
</style>


<div style="overflow-x: hidden;" class="hero is-fullheight is-primary">
  <NotificationContainer />
  <div class="hero-head">
    <div
      on:mouseenter={e => mouseEnteredNav = true}
      on:mouseleave={e => mouseEnteredNav = false}
      class="navbar has-transition has-text-white-bis {mouseEnteredNav ? 'has-background-primary-dark2' : 'has-background-primary'} is-spaced">
      <div class="navbar-brand mr-3">
        <a href="/" class="is-flex is-align-items-center">
          <div class="is-flex is-align-items-center">
            <!-- logo -->
            <img class="maxmins-w-30 maxmins-h-30 ml-3" src="/images/axionFinalLogo.png" alt="Axion logo">
      
            <!-- name -->
            <div class="fredokaone is-size-4-tablet is-size-5-mobile ml-3">
              Axion
            </div>
          </div>
        </a>
    
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          on:click={e => menuActive = !menuActive}
          class="navbar-burger {menuActive ? 'is-active' : ''}" >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </div>
      </div>
    
      <div class="navbar-menu fredoka-reg {menuActive ? 'is-active' : ''}">
        <div class="navbar-end">
          {#each navbarEndLinks as item}
            <a href="{item.href}" class="navbar-item has-text-centered {item.label === 'Signin' && !menuActive ? 'mr-3' : ''}">
              {item.label}
            </a>
          {/each}
    
          <a href="/Signup" class="navbar-item has-text-centered has-transition button is-size-7 is-success fredoka-reg">
            Signup
          </a>
        </div>
      </div>
    </div>
  </div>

	<!-- MAIN CONTENT HERE -->
  <slot />
	<!-- MAIN CONTENT END -->

  <div
    on:mouseenter={() => mouseEnteredFoot = true}
    on:mouseleave={() => mouseEnteredFoot = false}
    class="hero-foot px-3 py-5 has-transition {mouseEnteredFoot ? 'has-background-primary-dark2' : 'has-background-primary'} {innerWidth < 571 ? 'has-background-primary-dark2' : ''}">
		<div class="level">
			<div class="level-left">
				<!-- logo -->
				<div class="level-item is-flex is-align-items-center is-justify-content-center">
					<img class="maxmins-w-20 maxmins-h-20" src="/images/axionFinalLogo.png" alt="Axion logo">
          <!-- name -->
          <div class="fredoka-reg txt-size-14 ml-2">
            Axion v2.0 2022
          </div>
				</div>
			</div>

			<div class="level-right">
				<a href="/Terms&Conditions" class="txt-size-14 fredoka-reg level-item is-underlined">
					Terms & conditions
				</a>

				<a href="/Privacy_Policy" class="txt-size-14 fredoka-reg level-item is-underlined">
					Privacy policy
				</a>
			</div>
		</div>
  </div>
</div>

<button on:click={goTop} style="opacity: {hidden ? '0%' : '100%'};" class='has-transition pos-fix rounded-circle pos-b-3p pos-r-2p has-background-white-bis maxmins-w-50 maxmins-h-50 is-flex is-justify-content-center is-align-items-center'>
	<Icon size="50px" path={mdiChevronUp} />
</button>