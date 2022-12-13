<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import validators from '$lib/configs/validators';
	import { notifs } from '$lib/stores/global.store';
	import { changeEmailCodeModalActive, changePassCodeModalActive, newEmailNew, newPassword } from '$lib/stores/myProfile.store';
	import { mdiClose } from '@mdi/js';
	import bcryptjs from 'bcryptjs';
	import { Moon } from 'svelte-loading-spinners';
  import { Dialog, Button, TextField, Icon } from 'svelte-materialify'

  export let data

  let verifyingCode = false
  let code = ''

  const close = () => {
    if(verifyingCode) return
    localStorage.removeItem('xCode')
    localStorage.removeItem('xeEmail')
    changeEmailCodeModalActive.set(false)
  }

  const updateEmail = async () => {
    if(verifyingCode) return
    if(!validators.isEmailValid($newEmailNew)) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Email is invalid please try again',
          type: 'error',
          id: (Math.random() * 999) + 1
        }
      ]
      return
    }
    if(!bcryptjs.compareSync(code, localStorage.getItem('xeCode'))) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Wrong code please try again',
          type: 'error',
          id: (Math.random() * 999) + 1
        }
      ]
      return
    }
    verifyingCode = true

    let form = document.getElementById('formChangeEmailSecPhase')
    const data = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    if(result.type === 'invalid') {
      $notifs = [...$notifs, {
        msg: result.data.message,
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
      verifyingCode = false
    }

    if(result.type === 'redirect') {
      localStorage.clear()
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    verifyingCode = false
    if(result.type === 'success' || result.type === 'redirect') {
      $notifs = [...$notifs, {
        msg: 'Successfully updated email, please login again',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      close()
    }
  }
</script>

<form action="?/changeEmailSecPhase" id='formChangeEmailSecPhase' class='is-hidden' use:enhance>
  <input type="text" name='id' bind:value={data.user.id}>
  <input type="text" name='email' bind:value={$newEmailNew}>
</form>

<Dialog persistent bind:active={$changeEmailCodeModalActive}>
  <div class='maxmins-w-100p has-background-white p-2'>
    <div class="maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center">
      <div class='fredoka-reg'>
        Change password
      </div>

      <Button disabled={verifyingCode} size='small' icon on:click={close}>
        <Icon class='red-text' path={mdiClose} />
      </Button>
    </div>

    <div class='maxmins-w-100p mb-3'>
      <div class='fredoka-reg txt-size-12'>
        Check the code sent to your email to verify the update to your password
      </div>
    </div>

    <TextField
      type='text'
      required
      dense
      outlined
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
    <div class='maxmins-w-100p is-flex is-justify-content-end mt-6'>
      <Button text size='small' class='has-background-grey-lighter' disabled={verifyingCode} on:click={updateEmail}>
        {#if !verifyingCode}
          Submit
        {:else}
          <Moon size={20} color="#000" />
        {/if}
      </Button>
    </div>
  </div>
</Dialog>