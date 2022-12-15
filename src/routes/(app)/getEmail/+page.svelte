<script>
	import { applyAction, deserialize } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import validators from "$lib/configs/validators";
	import { Button, TextField } from "svelte-materialify";
  import bcryptjs from "bcryptjs";
	import { Moon } from "svelte-loading-spinners";

  let innerWidth = 0
  let email = ''
  let note = 'Enter your email to send a reset code'
  let verifyingCode = false
  let sendingCode = false
  let changingPass = false
  let phase = 1
  let code = ''
  let newPassword = ''

  $: emailError = email === ''
  $: codeError = code === ''
  $: newPass = newPassword === ''

  const sendCode = async () => {
    if(sendingCode) return
    if(!validators.isEmailValid(email)) return
    sendingCode = true
    let form = document.getElementById('formResetPassword')
    const data = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    if(result.type === 'invalid') {
      note = `${result.data.message}`
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      note = 'Check your email inbox for the reset code'
      await invalidateAll();
    }

    applyAction(result);
    sendingCode = false
    if(result.type === 'success') {
      localStorage.setItem('asdf', result.data.code)
      phase = 2
    }
  }

  const verifyCode = async () => {
    verifyingCode = true
    if(!bcryptjs.compareSync(code, localStorage.getItem('asdf'))) {
      note = 'Code is incorrect, try again'
    } else {
      note = 'Make sure to remember your password now'
      phase = 3
      localStorage.removeItem('asdf')
    }
    verifyingCode = false
  }

  const changePass = async () => {
    if(changingPass) return
    if(!validators.isPassValid(newPassword)) return false
    verifyingCode = true
    let form = document.getElementById('formResetPassword2')
    const data = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    if(result.type === 'invalid') {
      note = `${result.data.message}`
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    verifyingCode = false
    if(result.type === 'success') {
      note = 'Password reset!, log in now'
      localStorage.removeItem('asdf')
      phase = 4
    }
  }
</script>

<svelte:head>
  <title>
    Axion | Reset
  </title>
</svelte:head>

<svelte:window bind:innerWidth />

<div class='is-hidden'>
  <form action="?/resetPassword" id='formResetPassword' class='is-hidden'>
    <input type="text" name='email' bind:value={email}>
  </form>

  <form action="?/resetPassword2" id='formResetPassword2' class='is-hidden'>
    <input type="text" name='email' bind:value={email}>
    <input type="text" name='newPassword' bind:value={newPassword}>
  </form>
</div>

<div class='flex-grow-1 p-2 centerxy is-flex-direction-column'>
  <div class='centerxy is-flex-direction-column has-background-white py-6 pr-9 pl-9 rounded'>
    <div class='mb-10'>
      <div class='image is-64x64'>
        <img src="/images/axionFinalLogo.png" alt="Axion logo">
      </div>
    </div>
  
    <div class='fredoka-reg mb-3 black-text'>
      {note}
    </div>
  
    <div class='has-background-white rounded maxmins-w-100p mb-6'>
      {#if phase == 1}
        <TextField
          dense
          outlined
          bind:value={email}
          disabled={sendingCode}
          type='text'
          error={emailError}
          rules={[
            /** @param {string} v */ v => v !== '' || 'Email cannot be empty',
            /** @param {string} v */ v => validators.isEmailValid(v) || 'Email is not valid'
          ]}
          class='fredoka-reg txt-size-13'
        >
          Email
        </TextField>
      {:else if phase == 2}
        <TextField
          dense
          outlined
          bind:value={code}
          disbabled={verifyingCode}
          type='text'
          rules={[
            /** @param {string} v */ v => v !== '' || 'Code cannot be empty',
            /** @param {string} v */ v => validators.containsDigit(v) || 'Code must and only contains digit or numbers',
            /** @param {string} v */ v => !validators.containsSpecialChar(v) || 'Code cannot contain special characters',
            /** @param {string} v */ v => !validators.containsLowerCase(v) || 'Code cannot contain alphabet characters',
            /** @param {string} v */ v => !validators.containsUpperCase(v) || 'Code cannot contain alphabet characters',
            /** @param {string} v */ v => v.length == 6 || 'Code must be 6 digits only',
          ]}
          error={codeError}
          class='fredoka-reg txt-size-13'
        >
          Code
        </TextField>
      {:else if phase == 3}
        <TextField
          dense
          outlined
          bind:value={newPassword}
          disbabled={changingPass}
          type='password'
          rules={[
            /** @param {string} v */ v => v !== '' || 'Password cannot be empty',
            /** @param {string} v */ v => v.length >= 8 || 'Password must be atleast 8 characters',
            /** @param {string} v */ v => validators.containsUpperCase(v) || 'Password must have atleast 1 (one) upper cased letter',
            /** @param {string} v */ v => validators.containsLowerCase(v) || 'Password must have atleast 1 (one) lower cased letter',
            /** @param {string} v */ v => validators.containsDigit(v) || 'Password must have atleast 1 (one) digit',
            /** @param {string} v */ v => validators.containsSpecialChar(v) || 'Password must have atleast 1 (one) special characters: ~!$%^&*_=+}{\'?-'
          ]}
          error={newPass}
          class='fredoka-reg txt-size-13'
        >
          New password
        </TextField>
      {/if}
    </div>

    <div>
      {#if !sendingCode && !verifyingCode && !changingPass}
        {#if phase == 1}
          <Button
            text
            class='has-background-primary has-text-white'
            size='{innerWidth < 571 ? 'small' : 'default'}'
            on:click={sendCode}
          >
            Submit
          </Button>
        {:else if phase == 2}
          <Button
            text
            class='has-background-primary has-text-white'
            size='{innerWidth < 571 ? 'small' : 'default'}'
            on:click={verifyCode}
          >
            Submit
          </Button>
        {:else if phase == 3}
          <Button
            text
            class='has-background-primary has-text-white'
            size='{innerWidth < 571 ? 'small' : 'default'}'
            on:click={changePass}
          >
            Reset password
          </Button>
        {:else}
          <a
            href="/Signin"
            data-sveltekit-preload-code='eager'
          >
            <Button
              text
              class='has-background-primary has-text-white'
              size='{innerWidth < 571 ? 'small' : 'default'}'
            >
              Login
            </Button>
          </a>
        {/if}
      {:else}
        <Moon size={30} color='#000' />
      {/if}
    </div>
  </div>
</div>