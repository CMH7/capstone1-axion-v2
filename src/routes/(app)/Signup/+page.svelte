<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import constants from "$lib/configs/constants";
  import validators from "$lib/configs/validators";
	import { notifs } from "$lib/stores/global.store"
	import { onMount } from "svelte";
	import { Button, Divider, MaterialApp, Select, TextField, Window, WindowItem } from "svelte-materialify";
  import { Pulse } from 'svelte-loading-spinners'

  let innerWidth          = 0
  let rotz                = 0
  let reverse             = false
  let disabled            = false
  let currentStep         = 0
  let repassword          = ''
  let creating            = false

  // users informations
  let age                 = 18
  let course              = 'Anthropology'
  let email               = ''
  let firstName           = ''
  let gender              = 'Male'
  let lastName            = ''
  let password            = ''
  let school              = 'ABE International College of Business and Accountancy'
  let year                = 1

  // dynamically checking of variales
  $: firstNameError = firstName === ''
  $: lastNameError = lastName === ''
  $: schoolError = school === ''
  $: courseError = course === ''
  $: emailError = email === ''
  $: passRepassError = password !== repassword
  $: passError = password === ''
  $: repassError = repassword === ''

  const keyDown = (/** @type {any} */ e) => {

  }

  const startAnim = () => {
    setInterval(() => {
      if(rotz == 720 || rotz == -1) reverse = !reverse
      if(reverse) {
        rotz--
      }else {
        rotz++
      }
    }, 50)
  }

  const next = async () => {
    if(currentStep == 0) {
      if(firstName === '' || validators.containsDigit(firstName) || validators.containsSpecialChar(firstName)) return
      if(lastName === '' || validators.containsDigit(lastName) || validators.containsSpecialChar(lastName)) return
      if(age < 18 || age > 70) return
      currentStep++
      return
    }

    if(currentStep == 1) {
      if(school === '') return
      if(course === '') return
      if(year < 1 || year > 6) return
      currentStep++
      return
    }

    if(currentStep == 2) {
      if(!validators.isEmailValid(email)) return
      if(!validators.isPassValid(password)) return
      if(!validators.isPassValid(repassword)) return

      creating = true

      let form = document.getElementById('formSignup')
      const data = new FormData(form);

      const response = await fetch(form.action, {
        method: 'POST',
        body: data
      });

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

      if (result.type === 'redirect') {
        $notifs = [...$notifs, {
          msg: 'Check your email inbox for verification',
          type: 'success',
          id: `${(Math.random() * 999) + 1}`
        }]
      }

      if (result.type === 'success') {
        // re-run all `load` functions, following the successful update
        await invalidateAll();
      }

      applyAction(result);
      creating = false
    }
  }

  onMount(() => {
    startAnim()
  })
</script>

<svelte:window bind:innerWidth on:keydown={keyDown}/>

<svelte:head>
  <title>
    Axion | Signup
  </title>
</svelte:head>

<form id='formSignup' action='?/signup' class="is-hidden" use:enhance>
  <input name='firstName' type="text" bind:value={firstName}>
  <input name='lastName' type="text" bind:value={lastName}>
  <input name='age' type="number" bind:value={age}>
  <input name='gender' type="text" bind:value={gender}>
  
  <input name='school' type="text" bind:value={school}>
  <input name='course' type="text" bind:value={course}>
  <input name='year' type="number" bind:value={year}>
  
  <input name='email' type="text" bind:value={email}>
  <input name='password' type="password" bind:value={password}>
</form>

<div class="hero-body pr-0 is-relative is-clipped">
  <!-- bg anim -->
  <div style="min-width: {innerWidth}vw" class="is-clipped maxmins-h-100v z-0 pos-abs pos-t-0 pos-l-0">
    <img width='{innerWidth}' style='filter: blur({innerWidth < 571 ? '50' : '150'}px)' class="rot-z-{rotz} has-transition" src="/images/axionFinalLogo.png" alt="Axion logo">
  </div>

  <!-- content -->
  <div class="columns maxmins-w-100p z-2">
    <!-- right side -->
    <div class="column is-6-desktop is-12-touch">
      <div class="maxmins-w-100p centerxy">
        <div class="rounded maxmins-w-100p is-clipped">
          <MaterialApp>
            <div class="has-background-white p-{innerWidth < 571 ? '3' : '6'}">
              <!-- steps -->
              <Window value={currentStep}>
                <!-- personal information -->
                <WindowItem class='pb-16'>
                  <div class="fredoka-reg is-size-6-tablet is-size-7-mobile has-text-grey-dark">
                    Personal information
                  </div>
                  <Divider class='{innerWidth < 571 ? 'mt-2 mb-4' : ''}' />

                  <!-- firstName -->
                  <TextField
                    outlined
                    type='text'
                    {disabled}
                    required
                    error={firstNameError}
                    bind:value={firstName}
                    rules={[
                      /** @param {string} v */ v => v !== '' || 'First name cannot be empty',
                      /** @param {string} v */ v => !validators.containsDigit(v) || 'Warning first name contains a digit',
                      /** @param {string} v */ v => !validators.containsSpecialChar(v) || 'Warning first name contains special characters'
                    ]}
                    color='indigo darken-4'
                    class='fredoka-reg mb-4'
                  >
                    First name
                  </TextField>

                  <!-- lastName -->
                  <TextField
                    outlined
                    type='text'
                    {disabled}
                    required
                    error={lastNameError}
                    bind:value={lastName}
                    rules={[
                      /** @param {string} v */ v => v !== '' || 'Last name cannot be empty',
                      /** @param {string} v */ v => !validators.containsDigit(v) || 'Warning last name contains a digit',
                      /** @param {string} v */ v => !validators.containsSpecialChar(v) || 'Warning last name contains special characters'
                    ]}
                    color='indigo darken-4'
                    class='fredoka-reg mb-4'
                  >
                    Last name
                  </TextField>

                  <div class="maxmins-w-100p is-flex is-justify-content-space-between">
                    <!-- age -->
                    <div class="maxmins-w-40p">
                      <TextField
                        outlined
                        type='number'
                        {disabled}
                        required
                        bind:value={age}
                        rules={[
                          /** @param {number} v */ v => v >= 18 || 'Age cannot be less than 18',
                          /** @param {number} v */ v => v <= 70 || 'Age cannot be greater than 70'
                        ]}
                        color='indigo darken-4'
                        class='fredoka-reg mb-4'
                        min={18}
                        max={70}
                      >
                        Age
                      </TextField>
                    </div>

                    <!-- gender -->
                    <div class="maxmins-w-55p">
                      <Select
                        mandatory
                        outlined
                        bind:value={gender}
                        items={[{value: 'Male', name: 'Male'}, {value: 'Female', name: 'Female'}]}
                      >
                        Gender
                      </Select>
                    </div>
                  </div>
                </WindowItem>

                <!-- Education information -->
                <WindowItem class='pb-16'>
                  <div class="fredoka-reg is-size-6-tablet is-size-7-mobile has-text-grey-dark">
                    Education background
                  </div>
                  <Divider class='{innerWidth < 571 ? 'mt-2 mb-4' : ''}' />

                  <!-- school -->
                  <TextField
                    list='schoolsPH'
                    type='text'
                    outlined
                    error={schoolError}
                    bind:value={school}
                    rules={[
                      /** @param {string} v */ v => v !== '' || 'School cannot be empty',
                    ]}
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
                    list='coursesPH'
                    type='text'
                    outlined
                    error={courseError}
                    bind:value={course}
                    rules={[
                      /** @param {string} v */ v => v !== '' || 'Course cannot be empty',
                    ]}
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
                    outlined
                    type='number'
                    {disabled}
                    bind:value={year}
                    rules={[
                      /** @param {number} v */ v => v >= 1 || 'year cannot be less than 1',
                      /** @param {number} v */ v => v <= 6 || 'year cannot be greater than 6'
                    ]}
                    color='indigo darken-4'
                    class='fredoka-reg mb-4'
                    max={6}
                    min={1}
                  >
                    Year
                  </TextField>
                </WindowItem>

                <!-- account credentials -->
                <WindowItem class='pb-16'>
                  <div class="fredoka-reg is-size-6-tablet is-size-7-mobile has-text-grey-dark">
                    Account credentials
                  </div>
                  <Divider class='{innerWidth < 571 ? 'mt-2 mb-4' : ''}' />

                  <!-- Email -->
                  <TextField
                    outlined
                    type='email'
                    {disabled}
                    required
                    error={emailError}
                    bind:value={email}
                    rules={[
                      /** @param {string} v */ v => v !== '' || 'Email cannot be empty',
                      /** @param {string} v */ v => validators.isEmailValid(v) || 'Email is invalid',
                    ]}
                    color='indigo darken-4'
                    class='fredoka-reg mb-4'
                  >
                    Email
                  </TextField>
                  
                  <!-- password -->
                  <TextField
                    outlined
                    type='password'
                    {disabled}
                    required
                    error={passRepassError || passError}
                    bind:value={password}
                    rules={[
                      /** @param {string} v */ v => v !== '' || 'Password cannot be empty',
                      /** @param {string} v */ v => v.length > 8 || 'Password must be atleast 8 characters',
                      /** @param {string} v */ v => validators.containsUpperCase(v) || 'Password must have atleast 1 (one) upper cased letter',
                      /** @param {string} v */ v => validators.containsLowerCase(v) || 'Password must have atleast 1 (one) lower cased letter',
                      /** @param {string} v */ v => validators.containsDigit(v) || 'Password must have atleast 1 (one) digit',
                      /** @param {string} v */ v => validators.containsSpecialChar(v) || 'Password must have atleast 1 (one) special characters: ~!$%^&*_=+}{\'?-',
                      /** @param {string} v */ v => v === repassword || 'Password do not match with the password'
                    ]}
                    color='indigo darken-4'
                    class='fredoka-reg mb-4'
                  >
                    Password
                  </TextField>
                  
                  <!-- repassword -->
                  <TextField
                    outlined
                    type='password'
                    {disabled}
                    required
                    error={passRepassError || repassError}
                    bind:value={repassword}
                    rules={[
                      /** @param {string} v */ v => v !== '' || 'Password cannot be empty',
                      /** @param {string} v */ v => v.length > 8 || 'Password must be atleast 8 characters',
                      /** @param {string} v */ v => validators.containsUpperCase(v) || 'Password must have atleast 1 (one) upper cased letter',
                      /** @param {string} v */ v => validators.containsLowerCase(v) || 'Password must have atleast 1 (one) lower cased letter',
                      /** @param {string} v */ v => validators.containsDigit(v) || 'Password must have atleast 1 (one) digit',
                      /** @param {string} v */ v => validators.containsSpecialChar(v) || 'Password must have atleast 1 (one) special characters: ~!$%^&*_=+}{\'?-',
                      /** @param {string} v */ v => v === password || 'Password do not match with the password'
                    ]}
                    color='indigo darken-4'
                    class='fredoka-reg mb-4'
                  >
                    Repassword
                  </TextField>

                  <!-- password notes -->
                  {#key password}
                    {#if !(password.length >= 8 && validators.containsUpperCase(password) && validators.containsLowerCase(password) && validators.containsDigit(password) && validators.containsSpecialChar(password))}
                      <div class="maxmins-w-100p pl-3 has-text-grey-dark fredoka-reg">
                        <div class="txt-size-12 maxmins-w-100p">
                          In order to protect your account, make sure that your password:
                        </div>
                        <ul class="txt-size-11 ul">
                          <li class='{password.length >= 8 ? 'undisp' : ''}'>has a length of at least 8 characters</li>
                          <li class='{validators.containsUpperCase(password) ? 'undisp' : ''}'>has at least 1 uppercased letter</li>
                          <li class='{validators.containsLowerCase(password) ? 'undisp' : ''}'>has at least 1 lowercased letter</li>
                          <li class='{validators.containsDigit(password) ? 'undisp' : ''}'>has at least 1 number or digit</li>
                          <li class='{validators.containsSpecialChar(password) ? 'undisp' : ''}'>has at least 1 special characters, such as ~!$%^&*_=+{`}{`}?-</li>
                        </ul>
                      </div>
                    {/if}
                  {/key}
                </WindowItem>
              </Window>

              <!-- buttons -->
              <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between mt-6">
                <Button depressed class='has-background-primary has-text-white {currentStep == 0 || creating ? 'opacity-0p' : ''}' on:click={() => currentStep--}>
                  Back
                </Button>
                <Button depressed class='has-background-primary has-text-white' on:click={next}>
                  {#if !creating}
                    {currentStep == 3 ? 'Signup' : 'Next'}
                  {:else}
                    <Pulse size={20} color='#fff' />
                  {/if}
                </Button>
              </div>
            </div>
          </MaterialApp>
        </div>
      </div>
    </div>

    <!-- left sides -->
    <div class="column is-6-desktop is-12-tablet is-hidden-mobile">
      <div class="maxmins-w-100p is-flex is-flex-direction-column is-align-items-center is-relative">
        <div class="fredoka-reg  txt-size-30 pos-abs">
          Signup to
        </div>

        <div class="fredokaone txt-size-8rem">
          Axion
        </div>
      </div>
    </div>
  </div>
</div>