<script>
  //@ts-nocheck
	import { MaterialApp } from "svelte-materialify";

  let mouseEnteredSignup = false
  let innerWidth = 0
</script>

<svelte:window bind:innerWidth />

<div class="hero-body">
  <div class="columns is-vcentered is-centered is-multiline is-mobile">

    <div class="column is-4-desktop is-6-touch">
      <div class="is-flex is-flex-direction-column is-align-items-center">
        <img class="maxmins-w-80p" src="/images/axionFinalLogo.png" alt="Axion logo">
        <div class="fredokaone is-size-2-desktop is-size-3-tablet is-size-4-mobile mt-4">
          Axion
        </div>
      </div>
    </div>

    <div class="column is-4-desktop is-12-touch">
      <div class="is-flex is-flex-direction-column">
        <div class="fredoka-reg has-text-centered-touch {innerWidth < 571 ? 'txt-size-18 mb-3' : 'txt-size-35 mb-6'}">
          An online web-based academic task management tool for college students
        </div>

        <div class="inter-reg has-text-centered-touch {innerWidth < 571 ? 'txt-size-12' : 'txt-size-19 mt-6'}">
          Manage and complete your tasks wherever you are!
        </div>

        <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-center {innerWidth < 571 ? 'pt-0 mt-6' : 'pt-10 mt-6'}">
          <MaterialApp>
            <style>
              .has-background-primary-dark2 {
                background-color: hsl(240, 100%, 10%);
              }
            </style>
            <a
              on:mouseenter={e => mouseEnteredSignup = true}
              on:mouseleave={e => mouseEnteredSignup = false}
              href="/Signup"
              class="rounded has-text-centered has-text-white has-transition txt-size-{innerWidth < 571 ? '20 py-2 px-6 maxmins-w-50p' : '30 py-4 px-6 maxmins-w-30p'} {mouseEnteredSignup ? 'has-background-primary-dark2' : 'has-background-success'}">
              Signup
            </a>
          </MaterialApp>
        </div>
      </div>
    </div>
  </div>
</div>