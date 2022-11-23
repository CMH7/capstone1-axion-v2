<script>
	
  //@ts-nocheck
	import { onMount } from 'svelte'
  import { SlideGroup, SlideItem, MaterialApp} from 'svelte-materialify';

  const navbarEndLinks = [
    {label: 'Home', href: '/'},
    {label: 'About', href: '/About'},
    {label: 'Contact', href: '/Contact'},
    {label: 'Signin', href: '/Signin'}
  ]

  let menuActive = false
  let mouseEnteredNav = false
  let mouseEnteredSignup = false
  let innerWidth = 0
  let rotz = 0

  const startAnimation = () => {
    setInterval(() => {
      if(rotz == 720) rotz = 0
      rotz++
    }, 70)
  }
  
  onMount(() => {
    menuActive = false
    mouseEnteredNav = false
    mouseEnteredSignup = false
    startAnimation()
  })

</script>

<svelte:window bind:innerWidth />

<svelte:head>
  <title>
    Axion | About
  </title>
</svelte:head>

<div class="hero-body is-flex is-flex-direction-column p-0">
  <!-- banner -->
  <div class="maxmins-w-100p maxmins-h-{innerWidth < 571 ? '2': innerWidth < 1215 && innerWidth > 570 ? '4' : '6'}00 is-relative" style="overflow-y: hidden;">
    <div class="maxmins-w-100p maxmins-h-100p is-flex is-justify-content-center is-align-items-flex-end">
      <!-- bg image -->
      <img class="maxmins-w-100p rot-z-{rotz}" src="/images/axionFinalLogo.png" alt="Axion logo" style="filter: blur({innerWidth < 571 ? '30px' : innerWidth < 1215 && innerWidth > 570 ? '55px' : '120px'});">

      <!-- page header -->
      <div class="maxmins-w-100p maxmins-h-100p pos-abs pos-t-0 pos-l-0 is-flex is-flex-direction-column is-justify-content-center is-justify-content-center is-align-items-center">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <div class="fredoka-reg is-size-5-tablet is-size-6-mobile">
            What is
          </div>
          <div class="fredokaone {innerWidth < 571 ? 'txt-size-4rem' : 'txt-size-10rem'}">
            AXION
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- first -->
  <div class="section">
    <div class="columns is-multiline is-centered">
      <div class="column is-10">
        <div class="maxmins-w-100p is-flex is-align-items-center is-size-5-desktop is-size-6-tablet is-size-7-mobile has-text-centered fredoka-reg">
          Axion is meant to fit with the academic setting of college students- for them to manage their tasks and help them achieve better output.
        </div>
      </div>
      <div class="column is-12 mt-6">
        <div class="is-flex is-justify-content-center is-align-items-center">
          <img src="/images/responsive.png" class="maxmins-w-{innerWidth < 426 ? '200' : innerWidth < 1215 && innerWidth >= 321 ? '400' : '1000'}" alt="responsive axion">
        </div>
      </div>
    </div>
  </div>
</div>

  <!-- second -->
  <div class="section">
    <MaterialApp>
      <style>
        .a {
          margin: 0 10px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      </style>

      <SlideGroup centerActive activeClass="white-text" class='maxmins-w-100p maxmins-h-500'>
        {#each Array(15) as _, i}
          <SlideItem let:active class=''>
            <div class="rounded a is-flex p-3" class:primary-color={active} >
              <img src="/images/Icons/icon1.png" alt="icon1">
              <div>
                Text here {i}
              </div>
            </div>
          </SlideItem>
        {/each}
      </SlideGroup>
    </MaterialApp>
  </div>