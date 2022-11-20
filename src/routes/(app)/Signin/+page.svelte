<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import validators from "$lib/configs/validators";
	import { notifs } from "$lib/stores/global.store";
	import { mdiAccount, mdiEye, mdiEyeOff, mdiLock } from "@mdi/js";
	import { onMount } from "svelte";
  import { Avatar, Button, Divider, Icon, MaterialApp, TextField } from 'svelte-materialify'


  let email = ''
  let password = ''
  let rotz = 0
  let disabled = false
  let show = false
  let innerWidth = 0
  let signingin = false

  const startAnimation = () => {
    setInterval(() => {
      if(rotz == 720) rotz = 0
      rotz++
    }, 30)
  }

  const signin = () => {
    signingin = true
    handleSubmit()
  }

  async function handleSubmit(event) {
    let form = document.getElementById('form')
    const data = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data
    });

    console.log(response);

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    console.log(result);

    if(result.type === 'invalid') {
      $notifs = [...$notifs, {
        msg: result.data.message,
        type: 'error',
        id: `${(Math.random() * 999) + 1}`
      }]
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    signingin = false
  }

  onMount(() => {
    startAnimation()
  })
</script>

<svelte:window bind:innerWidth/>

<form
  id='form'
  class="is-hidden"
  action="?/signin"
  use:enhance
>
  <input name='email' type="text" bind:value={email}>
  <input name='password' type="password" bind:value={password}>
</form>

<div class="columns maxmins-h-80v" style="overflow-y: hidden; overflow-x: hidden;">
  <div class="column is-8-tablet is-12-mobile">
    <div class="is-flex {innerWidth < 571 ? 'is-flex-direction-column' : ''} maxmins-h-100p is-justify-content-center is-align-items-center is-flex-wrap-wrap maxmins-h-100p">
      <div style="overflow: hidden;" class="maxmins-w-{innerWidth < 571 ? '90p' : '50p'} mt-{innerWidth < 571 ? '16' : '0'} rounded-xl">
        <MaterialApp>
          <div class="has-background-white-bis p-{innerWidth < 571 ? '3' : '6'} maxmins-w-100p">
            <div class="maxmins-w-100p is-flex is-flex-direction-column is-justify-content-center is-align-items-center">
              <Avatar size='100px'>
                <img src="images/axionFinalLogo.png" alt="Axion logo">
              </Avatar>
              <div class="fredoka-reg is-size-6-desktop has-text-weight-bold has-text-grey-dark mt-3">
                Welcome back to Axion
              </div>
            </div>

            <Divider class='mt-13' />
            
            <TextField
              rounded
              outlined
              type='email'
              {disabled}
              bind:value={email}
              name='email'
              rules={[
                /** @param {string} v */ v => v !== '' || 'Email cannot be empty',
                /** @param {string} v */ v => validators.isEmailValid(v) || 'Email is not valid'
              ]}
              color='indigo darken-4'
              class='fredoka-reg'
            >
              <span slot='prepend'>
                <Icon path={mdiAccount} />
              </span>
              Email
            </TextField>
            
            <TextField
              rounded
              outlined
              type={show ? 'text' : 'password'}
              {disabled}
              bind:value={password}
              name='password'
              rules={[
                /** @param {string} v */ v => v !== '' || 'Password cannot be empty',
                /** @param {string} v */ v => v.length >= 8 || 'Password must be atleast 8 characters',
                /** @param {string} v */ v => validators.containsUpperCase(v) || 'Password must have atleast 1 (one) upper cased letter',
                /** @param {string} v */ v => validators.containsLowerCase(v) || 'Password must have atleast 1 (one) lower cased letter',
                /** @param {string} v */ v => validators.containsDigit(v) || 'Password must have atleast 1 (one) digit',
                /** @param {string} v */ v => validators.containsSpecialChar(v) || 'Password must have atleast 1 (one) special characters: ~!$%^&*_=+}{\'?-'
              ]}
              color='indigo darken-4'
              class='mt-3 fredoka-reg'
            >
              <span slot='prepend'>
                <Icon path={mdiLock} />
              </span>
              Password
              <button
                on:click={() => {
                  show = !show
                }}
                slot="append"
              >
                <Icon path={show ? mdiEyeOff : mdiEye} />
              </button>
            </TextField>

            <div class="maxmins-w-100p is-flex is-justify-content-center is-align-items-center mt-{innerWidth < 571 ? '8' : '16'}">
              <div class="maxmins-w-50p">
                <Button
                  on:click={signin}
                  block
                  rounded
                  depressed
                  size='large'
                  class='has-background-primary has-text-white'
                >
                  {#if !signingin}
                    Signin
                  {:else}
                    loading...
                  {/if}
                </Button>
              </div>
            </div>
          </div>
        </MaterialApp>
      </div>

    </div>
  </div>

  <div class="column is-4-tablet is-12-mobile">
    <div class="{innerWidth < 571 ? 'maxmins-w-100p' : 'image is-1by1'} is-relative">
      <img class="mt-{innerWidth < 571 ? '0' : '16'} rot-z-n{rotz}" style="filter: blur({innerWidth < 571 ? '30px' : '90px'})" src="/images/axionFinalLogo.png" alt="Axion logo">
      <div class="pos-abs pos-t-0 pos-l-0 maxmins-w-100p maxmins-h-100p is-flex is-flex-direction-column is-justify-content-center is-align-items-center">
        <div class="maxmins-w-100p has-text-centered fredoka-reg txt-size-30">
          Signin to
        </div>
        <div class="fredokaone txt-size-8rem">
          Axion
        </div>
      </div>
    </div>
  </div>
</div>