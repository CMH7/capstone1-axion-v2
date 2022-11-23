<script>
  //@ts-nocheck
	import { onMount } from 'svelte'
  import { Checkbox, MaterialApp, TextField} from 'svelte-materialify';
  import validators from '$lib/configs/validators';
  import constants from '$lib/configs/constants';
  
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
  let firstName = ''
  let lastName = ''
  let age = 18
  let course = ''
  let school = ''
  let year = 1
  let gender = ''
  let email = ''
  let password = ''
  let repassword = ''
  let curStep = 1
  let deg = 0
  let termsPrivacyCheck = false
  
  onMount(() => {
    menuActive = false
    mouseEnteredNav = false
    mouseEnteredSignup = false
  })

</script>

<svelte:window bind:innerWidth />

<svelte:head>
  <title>
    Axion | Signup
  </title>
</svelte:head>

<MaterialApp>
  <div class="hero is-fullheight is-primary">
    <div class="hero-head">
      <div
        on:mouseenter={e => mouseEnteredNav = true}
        on:mouseleave={e => mouseEnteredNav = false}
        class="navbar has-transition has-text-white-bis has-background-primary{mouseEnteredNav ? '-dark' : ''} is-spaced">
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

      <div class="is-flex is-flex-direction-column is-align-items-center">
        <img src="/images/axionFinalLogo.png" alt="axion logo" class='maxmins-w-100 maxmins-h-100 mt-6 has-transition rot-z-{deg}'>
        
        <div class="is-size-7-mobile is-size-6 fredoka-reg has-text-grey">
          Step {curStep} of 3
        </div>
      </div>
    </div>
  
    <div class="hero-body is-flex is-flex-direction-column">
      {#if curStep == 1}
      <div class="is-flex is-flex-direction-column maxmins-w-{innerWidth < 571 ? '100p' : '50p'}">
        <!-- title -->
        <div class="is-size-3 has-text-weight-semibold fredoka-reg is-size-4-mobile has-text-grey-dark mb-{innerWidth < 571 ? '4' : '8'}">
          Personal Information
        </div>
  
        <!-- first name -->
        <TextField
          type='text'
          outlined
          {disabled}
          bind:value={firstName}
          rules={[
            v => v !== '' || 'First name cannot be empty',
            v => !validators.containsDigit(v) || 'Warning first name contains digit. Axion does not allowing it.',
            v => !validators.containsSpecialChar(v) || 'Warning first name contains special characters. Axion does not allowing it.'
          ]}
          color='grey darken-2'
        >
          First name
        </TextField>
  
        <!-- last name -->
        <TextField
          type='text'
          outlined
          bind:value={lastName}
          rules={[
            v => v !== '' || 'Last name cannot be empty',
            v => !validators.containsDigit(v) || 'Warning last name contains digit. Axion does not allowing it.',
            v => !validators.containsSpecialChar(v) || 'Warning last name contains special characters. Axion does not allowing it.'
          ]}
          color='grey darken-2'
          class='mt-3'
        >
          Last name
        </TextField>
  
        <!-- age -->
        <TextField
          type='number'
          outlined
          bind:value={age}
          rules={[
            v => v != 0 || 'Age cannot be 0 (zero)',
            v => v >= 18 || 'Age is below the allowed age users (min. 18 yrs. old)',
            v => v <= 70 || 'Age is above the allowed age users (max. 70 yrs. old)',
          ]}
          color='grey darken-2'
          class='mt-3'
          max={70}
          min={18}
        >
          Age
        </TextField>
  
        <!-- Gender -->
        <Select
          outlined
          items={[
            {value: 'Male', name: 'Male'},
            {value: 'Female', name: 'Female'}
          ]}
          bind:value={gender}
          class='mt-3'
          mandatory={true}
        >
          Gender
        </Select>
  
      </div>
      {:else if curStep == 2}
      <div class="is-flex is-flex-direction-column maxmins-w-{innerWidth < 571 ? '100p' : '50p'}">
        <!-- title -->
        <div class="is-size-3 has-text-weight-semibold fredoka-reg is-size-4-mobile has-text-grey-dark mb-{innerWidth < 571 ? '4' : '8'}">
          Educational Information
        </div>
  
        <!-- School name -->
        <TextField
          list='schoolsPH'
          type='text'
          outlined
          bind:value={school}
          rules={[
            v => v !== '' || 'School cannot be empty',
          ]}
          color='grey darken-2'
        >
          School
        </TextField>
        <datalist id='schoolsPH'>
          {#each constants.schools as school }
            <option value={school}>{school}</option>
          {/each}
        </datalist>
  
        <!-- Course -->
        <TextField
          list='coursesPH'
          type='text'
          outlined
          bind:value={course}
          rules={[
            v => v !== '' || 'Course cannot be empty',
          ]}
          color='grey darken-2'
          class='mt-3'
        >
          Course
        </TextField>
        <datalist id='coursesPH'>
          {#each constants.courses.sort() as course }
            <option value={`${course}`}>{course}</option>
          {/each}
        </datalist>
        
        <!-- Year -->
        <TextField
          type='number'
          outlined
          bind:value={year}
          rules={[
            v => v != 0 || 'Year cannot be 0 (zero)',
            v => v >= 0 || 'Year is below the allowed grade year of users (min. 1st year)',
            v => v <= 6 || 'Year is above the allowed grade year of users (max. 6th years)',
          ]}
          color='grey darken-2'
          class='mt-3'
          max={6}
          min={1}
        >
          Year
        </TextField>
  
  
      </div>
      {:else}
      <div class="is-flex is-flex-direction-column maxmins-w-{innerWidth < 571 ? '100p' : '50p'}">
        <!-- title -->
        <div class="is-size-3 has-text-weight-semibold fredoka-reg is-size-4-mobile has-text-grey-dark mb-{innerWidth < 571 ? '4' : '8'}">
          Account Information
        </div>
  
        <!-- E-mail -->
        <TextField
          type='text'
          outlined
          {disabled}
          bind:value={email}
          rules={[
            v => v !== '' || 'Email cannot be empty',
            v => validators.isEmailValid(v) || 'Email is not valid'
          ]}
          color='grey darken-2'
        >
          Email
        </TextField>
  
        <TextField
          type='password'
          outlined
          {disabled}
          error={passRepassError}
          bind:value={password}
          rules={[
            v => v !== '' || 'Password cannot be empty',
            v => v.length >= 8 || 'Password must be atleast 8 characters',
            v => validators.containsUpperCase(v) || 'Password must have atleast 1 (one) upper cased letter',
            v => validators.containsLowerCase(v) || 'Password must have atleast 1 (one) lower cased letter',
            v => validators.containsDigit(v) || 'Password must have atleast 1 (one) digit',
            v => validators.containsSpecialChar(v) || 'Password must have atleast 1 (one) special characters: ~!$%^&*_=+}{\'?-',
            v => v === repassword || 'Password do not match with the password'
          ]}
          class='mt-3'
          color='grey darken-2'
        >
          Password
        </TextField>
        
        <!-- Re-password -->
        <TextField
          type='password'
          outlined
          {disabled}
          error={passRepassError}
          bind:value={repassword}
          rules={[
            v => v !== '' || 'Password cannot be empty',
            v => v.length >= 8 || 'Password must be atleast 8 characters',
            v => validators.containsUpperCase(v) || 'Password must have atleast 1 (one) upper cased letter',
            v => validators.containsLowerCase(v) || 'Password must have atleast 1 (one) lower cased letter',
            v => validators.containsDigit(v) || 'Password must have atleast 1 (one) digit',
            v => validators.containsSpecialChar(v) || 'Password must have atleast 1 (one) special characters: ~!$%^&*_=+}{\'?-',
            v => v === password || 'Repassword do not match with the password'
          ]}
          class='mt-3'
          color='grey darken-2'
        >
          Re-Password
        </TextField>
  
        <!-- password notes -->
        {#key password}
          {#if !(password.length >= 8 && validators.containsUpperCase(password) && validators.containsLowerCase(password) && validators.containsDigit(password) && validators.containsSpecialChar(password))}
            <div class="mt-3 maxmins-w-100p pl-3 has-text-grey-dark fredoka-reg">
              <div class="is-size-7 maxmins-w-100p">
                In order to protect your account, make sure that your password:
              </div>
              <ul class="is-size-7 ul">
                <li class='{password.length >= 8 ? 'is-hidden' : ''}'>has a length of at least 8 characters</li>
                <li class='{validators.containsUpperCase(password) ? 'is-hidden' : ''}'>has at least 1 uppercased letter</li>
                <li class='{validators.containsLowerCase(password) ? 'is-hidden' : ''}'>has at least 1 lowercased letter</li>
                <li class='{validators.containsDigit(password) ? 'is-hidden' : ''}'>has at least 1 number or digit</li>
                <li class='{validators.containsSpecialChar(password) ? 'is-hidden' : ''}'>has at least 1 special characters, such as ~!$%^&*_=+{`}{`}?-</li>
              </ul>
            </div>
          {/if}
        {/key}
  
        <!-- checkbox -->
        <div class="is-flex is-justify-content-center mt-16">
          <Checkbox bind:checked={termsPrivacyCheck}/>
          <div class="is-size-7 has-text-grey">
            Agree with <a class="has-text-link is-clickable hover-txt-style-underline" href="/Terms&Conditions" >Terms and conditions</a> and with the <a class="has-text-link is-clickable hover-txt-style-underline" href="/Privacy_Policy">Privacy policy</a> of the Axion
          </div>
        </div>
  
      </div>
      {/if}
  
      <div class="maxmins-w-{innerWidth < 571 ? '100p' : '50p'} mt-16 is-flex is-justify-content-space-between">
        <!-- previous button -->
        {#if curStep != 1 && !$isProcessing}
        <div
          on:click={e => {
            deg = curStep == 2 ? 0 : 360
            curStep--
          }}
        >
          <Button text class='has-background-grey-light has-text-white'>Back</Button>
        </div>
        {:else}
        <div></div>
        {/if}
  
        <!-- next button -->
        {#if curStep != 3}
        <div
          on:click={next}
        >
          <Button text class="has-background-primary has-text-white">Next</Button>
        </div>
        {:else}
          {#if $isProcessing}
            <Pulse size={20} color='#fddd3f' />
          {:else}
            <div 
              on:click={createNewUser}
            >
              <Button text class='has-background-primary has-text-white'>Sign up</Button>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  
    <div class="hero-foot p-3">
      <div class="is-flex is-justify-content-center is-align-items-center">
        <!-- logo -->
        <img class="maxmins-w-20 maxmins-h-20 ml-3" src="/images/axionFinalLogo.png" alt="Axion logo">
  
        <!-- name -->
        <div class="fredoka-reg-reg is-size-7 ml-3">
          Axion v2.0 2022
        </div>
      </div>
    </div>
  </div>
</MaterialApp>