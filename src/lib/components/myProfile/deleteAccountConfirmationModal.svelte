<script>
  //@ts-nocheck
  import { Dialog, Button, Icon, TextField } from 'svelte-materialify'
  import bcryptjs from 'bcryptjs'
	import { deleteAccoutConfirmationModalActive } from '$lib/stores/myProfile.store';
	import { mdiClose, mdiEye, mdiKey, mdiEyeOff } from '@mdi/js';
	import validators from '$lib/configs/validators';
	import { notifs } from '$lib/stores/global.store';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Moon } from 'svelte-loading-spinners';

  export let data

  let passType = true
  let innerWidth = 0
  let password = ''
  let verifyingCode = false
  let sendingCode = false
  let codeReceived = false
  let code =''
  let deleting = false

  $: passError = password === ''

  const close = () => {
    if(deleting) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Cannot close while deleting account is in process',
          type: 'warn',
          id: (Math.random() * 999) + 1
        }
      ]
      return
    }
    passType = true
    password = ''
    verifyingCode = false
    sendingCode = false
    codeReceived = false
    code = ''
    localStorage.removeItem('xexCodexex')
    deleteAccoutConfirmationModalActive.set(false)
  }

  const sendCode = async () => {
    if(!validators.isPassValid(password)) return
    if(!bcryptjs.compareSync(password, data.user.password)) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Wrong password please try again',
          type: 'warn',
          id: (Math.random() * 999) + 1
        }
      ]
      return
    }
    if(sendingCode) return
    sendingCode = true

    let form = document.getElementById('formDeleteAccountP1')
    const data2 = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data2
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    if(result.type === 'invalid') {
      $notifs = [...$notifs, {
        msg: result.data.message,
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
      sendingCode = false
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: `Code sent! check your email inbox in ${data.user.email} for the delete code`,
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      localStorage.setItem('xexCodexex', result.data.code)
      sendingCode = false
      codeReceived = true
    }
  }

  const deleteAccount = async () => {
    if(deleting) return
    deleting = true

    let form = document.getElementById('formDeleteAccountP2')
    const data2 = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data2
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    if(result.type === 'invalid') {
      $notifs = [...$notifs, {
        msg: result.data.message,
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
      deleting = false
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    if(result.type === 'success' || result.type === 'redirect') {
      $notifs = [...$notifs, {
        msg: 'Account deleted',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      deleting = false
      close()
    }
  }
</script>

<svelte:window bind:innerWidth />

<div class='is-hidden'>
  <form action="?/deleteAccountP1" id='formDeleteAccountP1' class='is-hidden' use:enhance>
    <input type="text" name='email' bind:value={data.user.email}>
  </form>

  <form action="?/deleteAccountP2" id='formDeleteAccountP2' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.user.id}>
  </form>
</div>

<Dialog persistent bind:active={$deleteAccoutConfirmationModalActive}>
  <div class='maxmins-w-100p has-background-white p-2'>
    <div class="maxmins-w-100p mb-3 is-flex is-justify-content-space-between">
      <div class='fredoka-reg'>
        Delete account
      </div>

      <Button icon size='small' on:click={close}>
        <Icon class='red-text' path={mdiClose} />
      </Button>
    </div>

    <div class='maxmins-w-100p mb-3'>
      <div class='fredoka-reg txt-size-14 pl-3'>
        {#if !deleting}
          {#if !codeReceived}
            Deleting your account will cause for your subjects, workspace, boards, tasks, files and progresses will be deleted too. Enter password to continue the process of deletion.
          {:else}
            Please think twice before submitting the delete code.
          {/if}
        {:else}
          Please do not reload or close the page, do not close the modal or go to other page while delete account is processing.
        {/if}
      </div>
    </div>

    {#if !deleting}
      {#if !codeReceived}
        <TextField
          dense
          outlined
          class='fredoka-reg mb-3'
          type={passType ? 'password' : 'text'}
          color='grey darken-2'
          bind:value={password}
          error={passError}
          autofocus
          rules={[
            /** @param {string} v */ v => v !== '' || 'Password cannot be empty',
            /** @param {string} v */ v => v.length >= 8 || 'Password must be atleast 8 characters',
            /** @param {string} v */ v => validators.containsUpperCase(v) || 'Password must have atleast 1 (one) upper cased letter',
            /** @param {string} v */ v => validators.containsLowerCase(v) || 'Password must have atleast 1 (one) lower cased letter',
            /** @param {string} v */ v => validators.containsDigit(v) || 'Password must have atleast 1 (one) digit',
            /** @param {string} v */ v => validators.containsSpecialChar(v) || 'Password must have atleast 1 (one) special characters: ~!$%^&*_=+}{\'?-'
          ]}
        >
          <div slot='prepend'>
            <Icon path={mdiKey} />
          </div>
          Password
          <div slot='append' class='is-clickable' on:click={() => passType = !passType}>
            {#if passType}
              <Icon path={mdiEyeOff} />
            {:else}
              <Icon path={mdiEye} />
            {/if}
          </div>
        </TextField>
      {:else}
        <TextField
          type='text'
          required
          dense
          outlined
          color='grey darken-2'
          rules={[
            /** @param {string} v */ v => v !== '' || 'Code cannot be empty',
            /** @param {string} v */ v => validators.containsDigit(v) || 'Code must and only contains digit or numbers',
            /** @param {string} v */ v => !validators.containsSpecialChar(v) || 'Code cannot contain special characters',
            /** @param {string} v */ v => !validators.containsLowerCase(v) || 'Code cannot contain alphabet characters',
            /** @param {string} v */ v => !validators.containsUpperCase(v) || 'Code cannot contain alphabet characters',
            /** @param {string} v */ v => v.length == 6 || 'Code must be 6 digits only',
          ]}
          disabled={verifyingCode}
          class='fredoka-reg'
          autofocus
          bind:value={code}
        >
          Code
        </TextField>
      {/if}
    {:else}
      <div class='maxmins-w-100p is-flex is-justify-content-center is-align-items-center'>
        <Moon size={100} color='#000' />
      </div>
    {/if}

    <div class='maxmins-w-100p is-flex is-justify-content-flex-end'>
      {#if !sendingCode}
        {#if !codeReceived}
          <Button text size='{innerWidth < 571 ? 'small' : 'default'}' class='has-background-grey-lighter' on:click={sendCode}>
            Next
          </Button>
        {:else}
          <Button text size='{innerWidth < 571 ? 'small' : 'default'}' class='has-background-grey-lighter' on:click={deleteAccount}>
            Submit
          </Button>
        {/if}
      {:else}
          <Moon size={20} color='#000' />
      {/if}
    </div>
  </div>
</Dialog>