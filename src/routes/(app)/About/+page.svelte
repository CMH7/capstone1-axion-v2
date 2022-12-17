<script>
	
  //@ts-nocheck
	import { onMount } from 'svelte'
  import { Tabs, Tab, Window, WindowItem, AppBar, Button, MaterialApp } from "svelte-materialify";

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
  let value = 0

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
    <div class="has-background-primary">
    <!-- 1st feature (image sa left, text sa right) -->
    <div class="columns my-2 py-4 is-flex is-justify-content-center is-align-items-center is-multiline has-background-white rounded-lg">
      
      <!-- Image -->
      <div class="column is-6-tablet is-9-mobile">
        <div class="is-flex is-justify-content-center">
          <img width="50%" height="50%" src="Icon/icon1.png" alt="icon1"/>
        </div>
      </div>

      <!-- Supporting text -->
      <div class="column mr-6 is-flex is-justify-content-start is-multiline">
          <p class="is-size-5-tablet {innerWidth < 571 ? 'txt-size-18' : 'txt-size-35'} is-primary has-text-centered fredoka-reg has-text-weight-bold"> In Axion, you can <span class="is-size-2-tablet is-size-5-mobile fredoka-reg mx-3 has-text-primary" style="font-weight:1000;">Organize</span> {#if innerWidth < 571 } <br/> {/if}your tasks in your own productive workspace.</p>
      </div>
    </div>

    <br/>
  
    <!-- 2nd feature (text sa left, image sa right) -->
    <div class="columns py-4 is-flex is-justify-content-center is-align-items-center is-mobile is-multiline has-background-white rounded-lg">

      <!-- Supporting text -->
      <div class="column is-hidden-mobile is-flex is-justify-content-center is-multiline has-background-white">
        <p class="is-size-5-tablet {innerWidth < 571 ? 'txt-size-18' : 'txt-size-35'} is-primary has-text-centered fredoka-reg has-text-weight-bold">Axion also emphasizes the {#if innerWidth < 571 } <br/> {/if}<span class="is-size-2-tablet is-size-5-mobile fredoka-reg mx-3 has-text-primary" style="font-weight:100;">most prioritized-</span> {#if innerWidth < 571 } <br/> {/if}tasks for users to notice it right away.</p>
      </div>

      <!-- Image -->
      <div class="column is-6-tablet is-9-mobile">
        <div class="is-flex is-justify-content-center">
          <img width="50%" height="50%" src="Icon/icon2.png" alt="icon2"/>
        </div>
      </div>

        <div class="column is-hidden-tablet is-flex is-justify-content-center is-multiline has-background-white">
          <p class="is-size-4-tablet {innerWidth < 571 ? 'txt-size-18' : 'txt-size-35'} is-primary has-text-centered fredoka-reg has-text-weight-bold">Axion also emphasizes the {#if innerWidth < 571 } <br/> {/if}<span class="is-size-2-tablet is-size-5-mobile fredoka-reg mx-3 has-text-primary" style="font-weight:100;">most prioritized</span> {#if innerWidth < 571 } <br/> {/if}tasks for users to notice it right away.</p>
        </div>

    </div>
      
    <br/>
  
    <!-- 3rd feature -->
    <div class="columns py-4 is-flex is-justify-content-center is-align-items-center is-multiline has-background-white rounded-lg">
      
      <!-- Image -->
      <div class="column is-6-tablet is-9-mobile">
        <div class="is-flex is-justify-content-center">
          <img width="50%" height="50%" src="Icon/icon3.png" alt="icon3"/>
        </div>
      </div>

      <!-- Supporting text -->
      <div class="column mr-6 is-flex is-justify-content-center is-multiline has-background-white">
        <p class="is-size-4-tablet {innerWidth < 571 ? 'txt-size-18' : 'txt-size-35'} is-primary has-text-centered fredoka-reg has-text-weight-bold">Axion can invite members for {#if innerWidth < 571 } <br/> {/if}<span class="is-size-2-tablet is-size-6-mobile fredoka-reg mx-3 has-text-primary" style="font-weight:100;">Group activities,</span> {#if innerWidth < 571 } <br/> {/if}with their screens  synchronized.</p>
      </div>
    </div>


  <div class="hero head m-6"> 
    <p class="mt-5 mb-3 is-size-3-tablet is-size-6-mobile has-text-white has-text-weight-bold has-text-centered fredoka-reg">Managing your academic work here in Axion is simple and easy.</p>
    
    <!-- 'Get Started' button (leads to Sign Up) -->
    <div class="is-flex flex-column is-align-items-center">
      <div class="mt-3 mb-10">
       <a 
       data-sveltekit-preload-code='eager'
       href="/Signup" class='button is-medium fredoka-reg has-background-white has-text-primary rounded-lg'>
        Sign up
      </a>
      </div>
    </div>
  </div>
  </div>
  </MaterialApp>
  </div>