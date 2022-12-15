<script>
  // @ts-nocheck
	import { goto, invalidateAll } from '$app/navigation';
	import helpers from '$lib/configs/helpers';
	import { breadCrumbsItems, currentIndex, global_USERID, loadingScreen, notifs } from '$lib/stores/global.store';
	import bcryptjs from 'bcryptjs';
	import { onMount } from 'svelte'
	import { Avatar, Button, Icon, Select, Textarea, TextField, Tooltip } from 'svelte-materialify';
  import { Moon } from 'svelte-loading-spinners'
	import { changeEmailCodeModalActive, changePassCodeModalActive, deleteAccoutConfirmationModalActive, newEmailNew, newPassword, uploadPicModalActive, verificationResent } from '$lib/stores/myProfile.store';
	import { mdiAccountOutline, mdiEyeOff, mdiAccountRemove, mdiCancel, mdiCheck, mdiEmail, mdiEye, mdiImageEditOutline, mdiKey, mdiPencil, mdiSendOutline } from '@mdi/js';
	import constants from '$lib/configs/constants';
	import validators from '$lib/configs/validators';
	import { applyAction, deserialize, enhance } from '$app/forms';

  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth = 0
  let editingProfile = false
  let updatingProfile = false
  let picHover = false
  let changeEmail = false
  let changePassword = false
  let updatingEmail = false
  let updatingPassword = false
  let newPass = ''
  let passType = false
  let canBeInvitedUpdating = false
  let showTutorialUpdating = false
  let showStatisticsUpdating = false
  let footerHintsUpdating = false
  let resendingVerification = false

  $: ogFirstName = data.user.firstName
  $: ogLastName = data.user.lastName
  $: ogAge = data.user.age
  $: ogGender = data.user.gender
  $: ogSchool = data.user.school
  $: ogCourse = data.user.course
  $: ogYear = data.user.year
  $: ogBio = data.user.bio
  $: newFirstName = ogFirstName
  $: newLastName = ogLastName
  $: newAge = ogAge
  $: newGender = ogGender
  $: newSchool = ogSchool
  $: newCourse = ogCourse
  $: newYear = ogYear
  $: newBio = ogBio
  $: firstNameError = data.user.firstName === ''
  $: lastNameError = data.user.lastName === ''
  $: schoolError = data.user.school === ''
  $: courseError = data.user.course === ''
  $: ogEmail = data.user.email
  $: newEmail = ogEmail
  $: passError = newPass === ''
  $: canBeInvitedR = data.user.canBeInvited ? 'off' : 'on'
  $: showTutorialR = data.user.showTutorial ? 'off' : 'on'
  $: showStatisticsR = data.user.showStatistics ? 'off' : 'on'
  $: footerHintsR = data.user.footerHints ? 'off' : 'on'

  const saveProfile = async () => {
    let changes = 0
    if(updatingProfile) return
    if(newFirstName !== ogFirstName && newFirstName !== '') changes++
    if(newLastName !== ogLastName && newLastName !== '') changes++
    if(newAge != ogAge && newAge > 0 && newAge < 71) changes++
    if(newGender !== ogGender && newGender !== '') changes++
    if(newSchool !== ogSchool && newSchool !== '') changes++
    if(newCourse !== ogCourse && newCourse !== '') changes++
    if(newYear != ogYear && newYear > 0 && newYear < 7) changes++
    if(newBio !== ogBio && newBio !== '' && newBio.length < 100) changes++
    if(changes == 0) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Nothing to update',
          type: 'warn',
          id: (Math.random() * 999) + 1
        }
      ]
      return
    }
    updatingProfile = true

    let form = document.getElementById('formEditBasicProfile')
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
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    updatingProfile = false
    if(result.type === 'success') {
      cancelEdits()
      $notifs = [...$notifs, {
        msg: 'Updated successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  const cancelEdits = () => {
    editingProfile = false
    newFirstName = ogFirstName
    newLastName = ogLastName
    newAge = ogAge
    newGender = ogGender
    newSchool = ogSchool
    newCourse = ogCourse
    newYear = ogYear
    newBio = ogBio
  }

  const changeEmailNow = async () => {
    if(updatingEmail) return
    if(newEmail === localStorage.getItem('exmxaxixlx')) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Email is the same with the old email, try another',
          type: 'warn',
          id: (Math.random() * 999) + 1
        }
      ]
      return
    }
    if(!validators.isEmailValid(newEmail)) return
    updatingEmail = true
    changeEmailCodeModalActive.set(true)

    let form = document.getElementById('formChangeEmail')
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
      updatingEmail = false
      changeEmailCodeModalActive.set(false)
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: `Code sent! check your email inbox in ${data.user.email} for the update code`,
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      console.log(result.data);
      localStorage.setItem('xeCode', result.data.code)
      newEmailNew.set(newEmail)
      changeEmail = false
    }
  }

  const changePasswordNow = async () => {
    if(updatingPassword) return
    if(newPass === '') return
    if(newPass === localStorage.getItem('xxx')) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Password is the same with the old password, try another',
          type: 'warn',
          id: (Math.random() * 999) + 1
        }
      ]
      return
    }
    if(!validators.isPassValid(newPass)) return
    updatingPassword = true
    changePassCodeModalActive.set(true)

    let form = document.getElementById('formChangePassword')
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
      updatingPassword = false
      changePassCodeModalActive.set(false)
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Code sent! check your email inbox for the reset code',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      localStorage.setItem('xCode', result.data.code)
      newPassword.set(newPass)
      changePassword = false
    }
  }

  const changeCanBeInvited = async () => {
    if(canBeInvitedUpdating) return
    canBeInvitedUpdating = true

    let form = document.getElementById('formChangeCanBeInvited')
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
      canBeInvitedUpdating = false
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Updated successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      canBeInvitedUpdating = false
    }
  }
  
  const changeShowTutorial = async () => {
    if(showTutorialUpdating) return
    showTutorialUpdating = true

    let form = document.getElementById('formChangeShowTutorial')
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
      showTutorialUpdating = false
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Updated successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      showTutorialUpdating = false
    }
  }
  
  const changeShowStatistics = async () => {
    if(showStatisticsUpdating) return
    showStatisticsUpdating = true

    let form = document.getElementById('formChangeShowStatistics')
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
      showStatisticsUpdating = false
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Updated successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      showStatisticsUpdating = false
    }
  }
  
  const changeFooterHints = async () => {
    if(footerHintsUpdating) return
    footerHintsUpdating = true

    let form = document.getElementById('formChangeFooterHints')
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
      footerHintsUpdating = false
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Updated successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      footerHintsUpdating = false
    }
  }

  const resendVerification = async () => {
    if(resendingVerification) return
    if($verificationResent) return
    resendingVerification = true

    let form = document.getElementById('formResendVerification')
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
      resendingVerification = false
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Verification resent successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
      resendingVerification = false
      verificationResent.set(true)
    }
  }

  onMount(() => {
    if(!bcryptjs.compareSync(localStorage.getItem('xxx'), data.user.password)) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Unauthorized accessing',
          type: 'warn',
          id: (Math.random() * 99) + 1
        }
      ]
      goto('/Signin', {replaceState: true})
      return
    }
    $breadCrumbsItems = [{text: 'My profile', href: '#'}]
    loadingScreen.set(false)
    global_USERID.set(data.user.id)
    helpers.resetPanels()
    currentIndex.set(3)
    verificationResent.set(data.user.verified)
  })
</script>

<svelte:head>
  <title>My profile</title>
</svelte:head>

<svelte:window bind:innerWidth />

<form action="?/editBasicProfile" id='formEditBasicProfile' class="is-hidden" use:enhance>
  <input type="text" name='id' bind:value={data.user.id}>
  <input type="text" name='firstName' bind:value={newFirstName}>
  <input type="text" name='lastName' bind:value={newLastName}>
  <input type="text" name='age' bind:value={newAge}>
  <input type="text" name='gender' bind:value={newGender}>
  <input type="text" name='school' bind:value={newSchool}>
  <input type="text" name='course' bind:value={newCourse}>
  <input type="text" name='year' bind:value={newYear}>
  <input type="text" name='bio' bind:value={newBio}>
</form>

<form action="?/changeEmail" id='formChangeEmail' class='is-hidden' use:enhance>
  <input type="text" name='id' bind:value={data.user.id}>
  <input type="text" name='email' bind:value={data.user.email}>
  <input type="text" name='newemail' bind:value={newEmail}>
</form>

<form action="?/changePassword" id='formChangePassword' class='is-hidden' use:enhance>
  <input type="text" name='email' bind:value={data.user.email}>
</form>

<form action="?/changeCanBeInvited" id='formChangeCanBeInvited' class='is-hidden' use:enhance>
  <input type="text" name='id' bind:value={data.user.id}>
  <input type="text" name='canBeInvited' bind:value={canBeInvitedR}>
</form>

<form action="?/changeShowTutorial" id='formChangeShowTutorial' class='is-hidden' use:enhance>
  <input type="text" name='id' bind:value={data.user.id}>
  <input type="text" name='showTutorial' bind:value={showTutorialR}>
</form>

<form action="?/changeShowStatistics" id='formChangeShowStatistics' class='is-hidden' use:enhance>
  <input type="text" name='id' bind:value={data.user.id}>
  <input type="text" name='showStatistics' bind:value={showStatisticsR}>
</form>

<form action="?/changeFooterHints" id='formChangeFooterHints' class='is-hidden' use:enhance>
  <input type="text" name='id' bind:value={data.user.id}>
  <input type="text" name='footerHints' bind:value={footerHintsR}>
</form>

<form action="?/deleteUser" id='formDeleteUser' class='is-hidden' use:enhance>
  <input type="text" name='id' bind:value={data.user.id}>
</form>

<form action="?/resendVerification" id='formResendVerification' class='is-hidden' use:enhance></form>

<div class="columns is-mobile is-multiline">
  <div class='column is-10-desktop is-10-desktop is-8-tablet is-12-mobile'>
    <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
      <!-- profile -->
      <div id='profile' class="maxmins-w-100p p-3">
        <!-- title and edit button -->
        <div class='mb-3 p-1 rounded maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center has-background-grey-lighter'>
          <div class="fredoka-reg txt-size-{innerWidth < 571 ? '15' : '20'} has-text-weight-semibold">
            Profile
          </div>

          <!-- buttons -->
          <div>
            {#if editingProfile && !updatingProfile}
              <Button
                depressed
                size='small'
                class='{innerWidth > 570 ? 'has-background-grey-light has-text-white' : ''}'
                icon={innerWidth < 571 ? true : false}
                on:click={cancelEdits}
              >
                {#if innerWidth < 571}
                  <Icon size={15} path={mdiCancel} />
                {:else}
                  Cancel
                {/if}
              </Button>
            {/if}
    
            <Button
              depressed
              size='small'
              class='{innerWidth > 570 ? 'has-background-grey-light has-text-white' : ''}'
              icon={innerWidth < 571 ? true : false}
              on:click={() => {
                if(editingProfile) {
                  saveProfile()
                  return
                }
                editingProfile = true
              }}
            >
              {#if !editingProfile}
                {#if innerWidth < 571}
                  <Icon size={15} class='red-text' path={mdiPencil} />
                {:else}
                  Edit
                {/if}
              {:else}
                {#if updatingProfile}
                  <Moon color='#000' size={20} />
                {:else}
                  {#if innerWidth < 571}
                    <Icon size={15} class='green-text' path={mdiCheck} />
                  {:else}
                    Save
                  {/if}
                {/if}
              {/if}
            </Button>
          </div>
        </div>

        <div style='{innerWidth < 571 ? 'a' : ''}background-image: url({`${data.user.profile}`}); background-position: top right; background-size: 70% 70%; background-attachment: fixed;' class='mt-1 columns is-mobile is-multiline rounded-lg is-clipped'>
          <!-- profile picture -->
          <div class='column has-background-white {editingProfile ? 'is-12' : 'is-2-tablet is-12-mobile'}'>
            <div class='centerxy'>
              <figure class="image is-128x128 centerxy rounded-circle is-clipped has-background-white is-relative" style="border: 1px solid rgba(0, 0, 0, 0.3)">
                {#if data.user.profile !== ''}
                  <img class='has-ratio maxmins-w-100p maxmins-h-100p' src="{data.user.profile}" alt='{data.user.firstName} {data.user.lastName}'>
                {:else}
                  <Icon size={100} class='{data.user.gender === 'Male' ? 'blue' : 'pink'}-text maxmins-w-100p maxmins-h-100p' path={mdiAccountOutline} />
                {/if}

                {#if editingProfile}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <div on:mouseenter={() => picHover = true} on:mouseleave={() => picHover = false} on:click={() => uploadPicModalActive.set(true)} style='background: rgba(0, 0, 0, 0.3)' class='is-clickable pos-abs pos-t-0 pos-r-0 maxmins-w-100p maxmins-h-100p centerxy {innerWidth < 571 ? '' : `opacity-${picHover ? '100' : '0'}p`}'>
                    <Icon size={100} class='maxmins-w-100p maxmins-h-100p' path={mdiImageEditOutline} />
                  </div>
                {/if}
              </figure>
            </div>
          </div>
          {#if !editingProfile}
            <div style='background: linear-gradient(155deg, rgba(255, 255, 255) 40%, rgba(255, 255, 255, 0))' class='column is-10-tablet is-12-mobile'>
              <!-- name -->
              <div class='fredoka-reg is-size-6 has-text-centered-mobile'>
                {data.user.firstName} {data.user.lastName}
              </div>
              
              <!-- email -->
              <div class='fredoka-reg has-text-centered-mobile txt-size-18'>
                {data.user.email}
              </div>

              <!-- school -->
              <div class='fredoka-reg has-text-centered-mobile txt-size-18'>
                {data.user.school}
              </div>
              
              <!-- year and course -->
              <div class='fredoka-reg has-text-centered-mobile txt-size-18'>
                {data.user.year} - {data.user.course}
              </div>

              <!-- gender -->
              <div class='fredoka-reg has-text-centered-mobile txt-size-18'>
                {data.user.gender} - {data.user.age} yrs. old
              </div>
            </div>
    
            <!-- bio -->
            {#if data.user.bio !== ''}
              <div style='background: linear-gradient(425deg, rgba(255, 255, 255) 40%, rgba(255, 255, 255, 0))' class='column is-12'>
                <div class='fredoka-reg min-h-{innerWidth < 571 ? 'fir-content' : '200'} has-background-white-bis rounded p-2 txt-size-18'>
                  {data.user.bio}
                </div>
              </div>
            {/if}
          {:else}
              <div style='backdrop-filter: blur(50px)' class='column is-12 has-background-white'>
                <div class='columns is-mobile is-multiline {editingProfile ? 'is-centered' : ''}'>
                  <div class='column is-6-tablet is-12-mobile'>
                    <!-- firstName -->
                    <TextField
                      dense
                      outlined
                      type='text'
                      required
                      error={firstNameError}
                      bind:value={newFirstName}
                      rules={[
                        /** @param {string} v */ v => v !== '' || 'First name cannot be empty',
                        /** @param {string} v */ v => !validators.containsDigit(v) || 'Warning first name contains a digit',
                        /** @param {string} v */ v => !validators.containsSpecialChar(v) || 'Warning first name contains special characters'
                      ]}
                      disabled={updatingProfile}
                      color='indigo darken-4'
                      class='fredoka-reg mb-4'
                    >
                      First name
                    </TextField>
                    
                    <!-- lastName -->
                    <TextField
                      dense
                      outlined
                      type='text'
                      required
                      error={lastNameError}
                      bind:value={newLastName}
                      rules={[
                        /** @param {string} v */ v => v !== '' || 'Last name cannot be empty',
                        /** @param {string} v */ v => !validators.containsDigit(v) || 'Warning last name contains a digit',
                        /** @param {string} v */ v => !validators.containsSpecialChar(v) || 'Warning last name contains special characters'
                      ]}
                      disabled={updatingProfile}
                      color='indigo darken-4'
                      class='fredoka-reg mb-4'
                    >
                      Last name
                    </TextField>
    
                    <!-- age -->
                    <TextField
                      dense
                      outlined
                      type='number'
                      required
                      bind:value={newAge}
                      rules={[
                        /** @param {number} v */ v => v >= 18 || 'Age cannot be less than 18',
                        /** @param {number} v */ v => v <= 70 || 'Age cannot be greater than 70'
                      ]}
                      disabled={updatingProfile}
                      color='indigo darken-4'
                      class='fredoka-reg mb-4'
                      min={18}
                      max={70}
                    >
                      Age
                    </TextField>
    
                    <!-- gender -->
                    <Select
                      dense
                      mandatory
                      outlined
                      bind:value={newGender}
                      items={[{value: 'Male', name: 'Male'}, {value: 'Female', name: 'Female'}]}
                      disabled={updatingProfile}
                      class='fredoka-reg mb-4'
                    >
                      Gender
                    </Select>
                    
                    <!-- school -->
                    <TextField
                      dense
                      list='schoolsPH'
                      type='text'
                      outlined
                      error={schoolError}
                      bind:value={newSchool}
                      rules={[
                        /** @param {string} v */ v => v !== '' || 'School cannot be empty',
                      ]}
                      disabled={updatingProfile}
                      color='indigo darken-4'
                      class='fredoka-reg mb-4'
                    >
                      School
                    </TextField>
                    <datalist id='schoolsPH'>
                      {#each constants.schools as schoola }
                        <option value={schoola}>{schoola}</option>
                      {/each}
                    </datalist>
      
                    <!-- Course -->
                    <TextField
                      dense
                      list='coursesPH'
                      type='text'
                      outlined
                      error={courseError}
                      bind:value={newCourse}
                      rules={[
                        /** @param {string} v */ v => v !== '' || 'Course cannot be empty',
                      ]}
                      disabled={updatingProfile}
                      color='indigo darken-4'
                      class='fredoka-reg mb-4'
                    >
                      Course
                    </TextField>
                    <datalist id='coursesPH'>
                      {#each constants.courses.sort() as coursea }
                        <option value={`${coursea}`}>{coursea}</option>
                      {/each}
                    </datalist>
      
                    <!-- year -->
                    <TextField
                      dense
                      outlined
                      type='number'
                      bind:value={newYear}
                      rules={[
                        /** @param {number} v */ v => v >= 1 || 'year cannot be less than 1',
                        /** @param {number} v */ v => v <= 6 || 'year cannot be greater than 6'
                      ]}
                      disabled={updatingProfile}
                      color='indigo darken-4'
                      class='fredoka-reg mb-4'
                      max={6}
                      min={1}
                    >
                      Year
                    </TextField>

                    <!-- bio -->
                    <Textarea
                      disabled={updatingProfile}
                      outlined
                      dense
                      bind:value={newBio}
                      placeholder="{data.user.bio}"
                      counter={100}
                      rules={[
                        v => {
                          if(v.length > 100) return '100 characters max only'
                          return true
                        }
                      ]}
                    >
                      Edit bio
                    </Textarea>
                  </div>
                </div>
              </div>
          {/if}
        </div>
      </div>

      <!-- statistics -->
      {#if data.user.showStatistics}
        <div class="maxmins-w-100p p-3 mb-6">
          <!-- title and edit button -->
          <div class='mb-3 p-1 rounded maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center has-background-grey-lighter'>
            <div class="fredoka-reg txt-size-{innerWidth < 571 ? '15' : '20'} has-text-weight-semibold">
              Statistics
            </div>
    
            <div />
          </div>

          <div class='columns is-mobile is-multiline is-centered'>

            <!-- owned subject -->
            <div class="column is-3-desktop is-4-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={innerWidth < 571 ? 70 : 100} class='has-background-primary has-text-white fredokaone txt-size-30'>
                    {data.ownedSubjectsCount}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} has-text-centered has-text-centered maxmins-w-100p centerxy'>
                  Created subject{data.ownedSubjectsCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- owned workspaces -->
            <div class="column is-3-desktop is-4-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={innerWidth < 571 ? 70 : 100} class='has-background-info has-text-white fredokaone txt-size-30'>
                    {data.ownedWorkspacesCount}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} has-text-centered maxmins-w-100p centerxy'>
                  Created workspace{data.ownedWorkspacesCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- joined workspaces -->
            <div class="column is-3-desktop is-4-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={innerWidth < 571 ? 70 : 100} class='has-background-success has-text-white fredokaone txt-size-30'>
                    {data.joinedWorkspacesCount}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} has-text-centered maxmins-w-100p centerxy'>
                  Joined in workspace{data.joinedWorkspacesCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- created tasks -->
            <div class="column is-3-desktop is-4-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={innerWidth < 571 ? 70 : 100} class='has-background-link has-text-white fredokaone txt-size-30'>
                    {data.createdTasksCount}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} has-text-centered maxmins-w-100p centerxy'>
                  Created task{data.createdTasksCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- assigned tasks -->
            <div class="column is-3-desktop is-4-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={innerWidth < 571 ? 70 : 100} class='has-background-link-light has-text-grey-dark fredokaone txt-size-30'>
                    {data.assignedTasksCount}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} has-text-centered maxmins-w-100p centerxy'>
                  Assigned task{data.assignedTasksCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- favorite subjects -->
            <div class="column is-3-desktop is-4-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={innerWidth < 571 ? 70 : 100} class='has-background-warning-light has-text-grey-dark fredokaone txt-size-30'>
                    {data.favoriteSubjectsCounts}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} has-text-centered maxmins-w-100p centerxy'>
                  Favorite subject{data.favoriteSubjectsCounts > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- favorite workspaces -->
            <div class="column is-3-desktop is-4-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={innerWidth < 571 ? 70 : 100} class='has-background-danger-light has-text-grey-dark fredokaone txt-size-30'>
                    {data.favoriteWorkspacesCounts}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} has-text-centered maxmins-w-100p centerxy'>
                  Favorite workspace{data.favoriteWorkspacesCounts > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- favorite tasks -->
            <div class="column is-3-desktop is-4-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={innerWidth < 571 ? 70 : 100} class='has-background-success-light has-text-grey-dark fredokaone txt-size-30'>
                    {data.favoriteTasksCounts}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} has-text-centered maxmins-w-100p centerxy'>
                  Favorite task{data.favoriteTasksCounts > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- credentials -->
      <div id='credentials' class="maxmins-w-100p p-3 mb-6">
        <!-- title and edit button -->
        <div class='mb-3 p-1 rounded maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center has-background-grey-lighter'>
          <div class="fredoka-reg txt-size-{innerWidth < 571 ? '15' : '20'} has-text-weight-semibold">
            Credentials
          </div>
  
          <div />
        </div>

        <div class='columns is-mobile is-multiline'>
          <div class='column is-12 mt-2 pb-0'>
            <TextField
              outlined
              bind:value={newEmail}
              readonly={!changeEmail}
              error={!data.user.verified}
              rules={[
                v => v !== '' || 'Email cannot be empty',
                v => validators.isEmailValid(v) || 'Email is not valid'
              ]}
              messages={!data.user.verified && !$verificationResent ? ['Unverified | Click send to resend verification mail'] : data.user.verified ? [] : ['Unverified']}
              color='indigo darken-4'
              class='fredoka-reg'
              id='emailField'
            >
              <div slot='prepend'>
                <Icon path={mdiEmail} />
              </div>
              Email
              <div slot='append'>
                {#if !data.user.verified && !$verificationResent}
                  <Tooltip bottom>
                    <Button icon on:click={resendVerification}>
                      {#if !resendingVerification}
                        <Icon path={mdiSendOutline} />
                      {:else}
                        <Moon size={20} color='#000' />
                      {/if}
                    </Button>
                    <div slot="tip">
                      <div class='fredoka-reg'>
                        Resend verification mail
                      </div>
                    </div>
                  </Tooltip>
                {/if}
              </div>
            </TextField>
          </div>
          {#if changeEmail}
            <div class="column is-12 py-0">
              <div class='fredoka-reg txt-size-13'>
                After a successful update on your email you will be logout and needs to relogin again.
              </div>
            </div>
          {/if}
          {#if data.user.verified}
            <div class="column is-12 pt-0">
              <div class='maxmins-w-100p is-flex is-justify-content-flex-end'>
                {#if changeEmail}
                  <Button text size='small' class='has-background-grey has-text-white mr-3' on:click={() => {
                    newEmail = data.user.email
                    changeEmail = false
                    document.getElementById('emailField').blur()
                  }}>
                    Cancel
                  </Button>
                {/if}
                <Button text size='small' class='has-background-grey has-text-white' on:click={() => {
                  if(changeEmail) {
                    changeEmailNow()
                    return
                  }
                  changeEmail = true
                  document.getElementById('emailField').focus()
                }}>
                  {#if !changeEmail && !$changeEmailCodeModalActive}
                    Change email
                  {:else if $changeEmailCodeModalActive}
                    <Moon color="#000" size={20} />
                  {:else}
                    Save
                  {/if}
                </Button>
              </div>
            </div>
          {/if}

          <div class='column is-12 pb-0'>
            <TextField
              outlined
              type='{passType ? 'text' : 'password'}'
              bind:value={newPass}
              readonly={!changePassword}
              disabled={!changePassword}
              color='indigo darken-4'
              class='fredoka-reg'
              id='passField'
              error={passError && changePassword}
              rules={[
                /** @param {string} v */ v => v !== '' || 'Password cannot be empty',
                /** @param {string} v */ v => validators.containsUpperCase(v) || 'Password must have atleast 1 (one) upper cased letter',
                /** @param {string} v */ v => validators.containsLowerCase(v) || 'Password must have atleast 1 (one) lower cased letter',
                /** @param {string} v */ v => validators.containsDigit(v) || 'Password must have atleast 1 (one) digit',
                /** @param {string} v */ v => validators.containsSpecialChar(v) || 'Password must have atleast 1 (one) special characters: ~!$%^&*_=+}{\'?-',
                /** @param {string} v */ v => v.length > 8 || 'Password must be atleast 8 characters'
              ]}
            >
              <div slot='prepend'>
                <Icon path={mdiKey} />
              </div>

              <div slot='append' class='is-clickable {changePassword ? '' : 'is-hidden'}' on:click={() => passType = !passType}>
                {#if passType}
                  <Icon path={mdiEye} />
                {:else}
                  <Icon path={mdiEyeOff} />
                {/if}
              </div>
              Password
            </TextField>
          </div>
          {#if changePassword}
            <div class="column is-12 py-0">
              <div class='fredoka-reg txt-size-13'>
                After a successful update on your password you will be logout and needs to relogin again.
              </div>
            </div>
          {/if}
          <div class="column is-12 pt-0">
            <div class='maxmins-w-100p is-flex is-justify-content-flex-end'>
              {#if changePassword}
                <Button text size='small' class='has-background-grey has-text-white mr-3' on:click={() => {
                  newPass = ''
                  changePassword = false
                  document.getElementById('passField').blur()
                }}>
                  Cancel
                </Button>
              {/if}
              <Button text size='small' class='has-background-grey has-text-white' on:click={() => {
                changePasswordNow()
                changePassword = true
                document.getElementById('passField').focus()
              }}>
                {#if !changePassword && !$changePassCodeModalActive}
                  Change password
                {:else if $changePassCodeModalActive}
                  <Moon color="#000" size={20} />
                {:else}
                  Save
                {/if}
              </Button>
            </div>
          </div>

        </div>
      </div>

      <!-- options -->
      <div id='option' class="maxmins-w-100p p-3 mb-6">
        <!-- title and edit button -->
        <div class='mb-3 p-1 rounded maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center has-background-grey-lighter'>
          <div class="fredoka-reg txt-size-{innerWidth < 571 ? '15' : '20'} has-text-weight-semibold">
            Options
          </div>
  
          <div />
        </div>

        <div class='columns is-mobile is-multiline'>
          <!-- canBeInvited -->
          <div class='column is-12 mb-3'>
            <div class='fredoka-reg tag'>
              Accept invitations
            </div>
            <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between pl-6">
              <div style='border-right: 1px solid rgba(0, 0, 0, 0.1)' class='pr-2 fredoka-reg txt-size-{innerWidth < 571 ? '13' : ''} maxmins-w-80p pr-1'>
                Allow other users to invite you in their workspaces, making you visible to public. Turning this off will make your account private except to the workspaces you're already in and other users can't invite you.
              </div>

               <Button icon class='mx-3 has-background-{data.user.canBeInvited ? 'success' : 'danger'} has-text-{data.user.canBeInvited ? 'success' : 'danger'}-dark' disabled={canBeInvitedUpdating} on:click={changeCanBeInvited}>
                {#if !canBeInvitedUpdating}
                  {#if data.user.canBeInvited}
                    <Icon path={mdiCheck} />
                  {:else}
                    <Icon path={mdiCancel} />
                  {/if}
                {:else}
                  <Moon size={20} color='#000' />
                {/if}
               </Button>
            </div>
          </div>
          
          <!-- showTutorial -->
          <div class='column is-12 mt-3'>
            <div class='fredoka-reg tag'>
              Show tutorial
            </div>
            <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between pl-6">
              <div style='border-right: 1px solid rgba(0, 0, 0, 0.1)' class='fredoka-reg txt-size-{innerWidth < 571 ? '13' : ''} maxmins-w-80p pr-1'>
                Allow axion to guide you by showing tutorials in every pages. Turning this off will stop axion guiding you except for hints if enabled.
              </div>

              <Button icon class='mx-3 has-background-{data.user.showTutorial ? 'success' : 'danger'} has-text-{data.user.showTutorial ? 'success' : 'danger'}-dark' disabled={showTutorialUpdating} on:click={changeShowTutorial}>
                {#if !showTutorialUpdating}
                  {#if data.user.showTutorial}
                    <Icon path={mdiCheck} />
                  {:else}
                    <Icon path={mdiCancel} />
                  {/if}
                {:else}
                  <Moon size={20} color='#000' />
                {/if}
               </Button>
            </div>
          </div>
          
          <!-- showStatistics -->
          <div class='column is-12 mt-3'>
            <div class='fredoka-reg tag'>
              Show statistics
            </div>
            <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between pl-6">
              <div style='border-right: 1px solid rgba(0, 0, 0, 0.1)' class='pr-2 fredoka-reg txt-size-{innerWidth < 571 ? '13' : ''} maxmins-w-80p pr-1'>
                Enabling this will display a statistics of your current progresses globally to all your subjects. Turning this off will not display and also reduce data being fetch and processes.
              </div>

              <Button icon class='mx-3 has-background-{data.user.showStatistics ? 'success' : 'danger'} has-text-{data.user.showStatistics ? 'success' : 'danger'}-dark' disabled={showStatisticsUpdating} on:click={changeShowStatistics}>
                {#if !showStatisticsUpdating}
                  {#if data.user.showStatistics}
                    <Icon path={mdiCheck} />
                  {:else}
                    <Icon path={mdiCancel} />
                  {/if}
                {:else}
                  <Moon size={20} color='#000' />
                {/if}
               </Button>
            </div>
          </div>
          
          <!-- showHints -->
          <div class='column is-12 mt-3'>
            <div class='fredoka-reg tag'>
              Show mini hints
            </div>
            <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between pl-6">
              <div style='border-right: 1px solid rgba(0, 0, 0, 0.1)' class='pr-2 fredoka-reg txt-size-{innerWidth < 571 ? '13' : ''} maxmins-w-80p pr-1'>
                Show short hints on the bottom part of the screen. Turning this off will show the Axion logo, name and its version instead.
              </div>

              <Button icon class='mx-3 has-background-{data.user.footerHints ? 'success' : 'danger'} has-text-{data.user.footerHints ? 'success' : 'danger'}-dark' disabled={footerHintsUpdating} on:click={changeFooterHints}>
                {#if !footerHintsUpdating}
                  {#if data.user.footerHints}
                    <Icon path={mdiCheck} />
                  {:else}
                    <Icon path={mdiCancel} />
                  {/if}
                {:else}
                  <Moon size={20} color='#000' />
                {/if}
               </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- danger zone -->
      <div id='danger' class="maxmins-w-100p p-3 mb-6 has-background-grey-lighter rounded">
        <!-- title and edit button -->
        <div class='mb-3 p-1 rounded maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center has-background-danger'>
          <div class="fredoka-reg has-text-white txt-size-{innerWidth < 571 ? '15' : '20'} has-text-weight-semibold">
            Danger zone
          </div>
  
          <div />
        </div>

        <div class='columns is-mobile is-multiline'>
          <!-- delete account button -->
          <div class='column is-12 mb-3'>
            <div class='fredoka-reg tag is-danger is-light'>
              Delete account
            </div>
            <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between pl-6">
              <div style='border-right: 1px solid rgba(0, 0, 0, 0.1)' class='pr-2 fredoka-reg txt-size-{innerWidth < 571 ? '13' : ''} maxmins-w-80p'>
                Delete your account. Deleting your account will cause for your subjects, workspace, boards, tasks, files and progresses will be deleted too. This will also result to automatic leaving to all workspaces you joined.
              </div>

              <Button icon={innerWidth < 571} text class='has-text-white has-background-danger' on:click={() => deleteAccoutConfirmationModalActive.set(true)} disabled={$deleteAccoutConfirmationModalActive}>
                {#if !$deleteAccoutConfirmationModalActive}
                  {#if innerWidth < 571}
                    <Icon class='white-text' path={mdiAccountRemove} />
                  {:else}
                    Delete
                  {/if}
                {:else}
                  <Moon size={20} color='#000' />
                {/if}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- left side -->
  <div class="column {innerWidth < 571 ? '' : 'pos-fix pos-r-0'} is-2-desktop is-4-tablet is-12-mobile" style="{innerWidth < 571 ? 'a' : ''}border-left: 1px solid rgba(0, 0, 0, 0.3)">
    <div class="maxmins-w-100p p-3 mb-6">
      <!-- title and edit button -->
      <div class='mb-3 p-1 rounded maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center has-background-grey-lighter'>
        <div class="fredoka-reg txt-size-17 has-text-weight-semibold has-text-grey">
          On this page
        </div>

        <div />
      </div>

      <div class='columns is-mobile is-multiline'>
        <div class='column is-12 mt-2'>
          <a href='#profile' class="fredoka-reg maxmins-w-100p has-background-white-ter rounded p-1">
            Profile
          </a>
        </div>
        <div class='column is-12 mt-2'>
          <a href='#credentials' class="fredoka-reg maxmins-w-100p has-background-white-ter rounded p-1">
            Account Credentials
          </a>
        </div>
        <div class='column is-12 mt-2'>
          <a href='#options' class="fredoka-reg maxmins-w-100p has-background-white-ter rounded p-1">
            Other settings
          </a>
        </div>
        <div class='column is-12 mt-2'>
          <a href='#danger' class="fredoka-reg maxmins-w-100p has-background-white-ter rounded p-1">
            Delete account
          </a>
        </div>
      </div>

    </div>

    <div class='maxmins-w-100p p-3 mb-6'>
      <div class='mb-3 p-1 rounded maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center has-background-grey-lighter'>
        <div class="fredoka-reg txt-size-17 has-text-weight-semibold has-text-grey">
          Agreements
        </div>

        <div />
      </div>

      <div class='columns is-mobile is-multiline'>
        <div class='column is-12 mt-2'>
          <a href='/Terms&Conditions' class="fredoka-reg maxmins-w-100p has-background-white-ter rounded p-1">
            Terms & conditions
          </a>
        </div>
        <div class='column is-12 mt-2'>
          <a href='/Privacy_Policy' class="fredoka-reg maxmins-w-100p has-background-white-ter rounded p-1">
            Privacy policy
          </a>
        </div>
      </div>
    </div>
  </div>
</div>