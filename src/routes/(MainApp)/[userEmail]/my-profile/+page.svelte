<script>
  // @ts-nocheck
	import { goto } from '$app/navigation';
	import helpers from '$lib/configs/helpers';
	import { breadCrumbsItems, global_USERID, loadingScreen, notifs } from '$lib/stores/global.store';
	import bcryptjs from 'bcryptjs';
	import { onMount } from 'svelte'
	import { Avatar, Button, Icon, Switch, TextField, Tooltip } from 'svelte-materialify';
  import { Moon } from 'svelte-loading-spinners'
	import { uploadPicModalActive } from '$lib/stores/myProfile.store';
	import { mdiAccountOutline, mdiCancel, mdiEmail, mdiImageEditOutline, mdiKey, mdiPencil, mdiSendOutline } from '@mdi/js';

  /** @type {import('./$types').PageServerData}*/
  export let data

  let innerWidth = 0
  let editingProfile = false
  let updatingProfile = false
  let updatingPic = false
  let updatingName = false


  const saveProfile = async () => {

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
  })
</script>

<svelte:head>
  <title>My profile</title>
</svelte:head>

<svelte:window bind:innerWidth />

<div class="columns is-mobile">
  <div class='column is-10-desktop is-8-tablet is-12-mobile'>
    <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
      <!-- profile -->
      <div id='profile' class="maxmins-w-100p p-3 mb-6">
        <!-- title and edit button -->
        <div class='mb-3 p-1 rounded maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center has-background-grey-lighter'>
          <div class="fredoka-reg txt-size-{innerWidth < 571 ? '15' : '20'} has-text-weight-semibold">
            Profile
          </div>

          <div>
            {#if editingProfile && !updatingProfile}
              <Button
                depressed
                size='small'
                class='{innerWidth > 570 ? 'has-background-grey-light has-text-white' : ''}'
                icon={innerWidth < 571 ? true : false}
                on:click={() => editingProfile = false}
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
                  <Icon size={15} path={mdiPencil} />
                {:else}
                  Edit
                {/if}
              {:else}
                {#if updatingProfile}
                  <Moon color='#000' size={20} />
                {:else}
                  Save
                {/if}
              {/if}
            </Button>
          </div>
        </div>

        <div class='columns is-mobile is-multiline'>
          <div class='column is-narrow-tablet is-12-mobile'>
            <div class='centerxy'>
              <figure class="image is-128x128 centerxy rounded-circle is-clipped has-background-white is-relative" style="border: 1px solid rgba(0, 0, 0, 0.3)">
                {#if data.user.profile !== ''}
                  <img class='has-ratio maxmins-w-100p maxmins-h-100p' src="{data.user.profile}" alt='{data.user.firstName} {data.user.lastName}'>
                {:else}
                  <Icon size={100} class='{data.user.gender === 'Male' ? 'blue' : 'pink'}-text maxmins-w-100p maxmins-h-100p' path={mdiAccountOutline} />
                {/if}

                {#if editingProfile}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <div on:click={() => uploadPicModalActive.set(true)} style='background: rgba(0, 0, 0, 0.3)' class='is-clickable pos-abs pos-t-0 pos-r-0 maxmins-w-100p maxmins-h-100p centerxy'>
                    <Icon size={100} class='maxmins-w-100p maxmins-h-100p' path={mdiImageEditOutline} />
                  </div>
                {/if}
              </figure>
            </div>
          </div>
  
          <div class='column is-narrow-tablet is-12-mobile'>
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
              {data.user.gender}
            </div>
          </div>
  
          {#if data.user.bio !== ''}
          <div class='column is-12'>
            <div class='fredoka-reg min-h-200 rounded p-2 txt-size-18' style='border: 1px solid rgba(0, 0, 0, 0.3)'>
              {data.user.bio}
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

          <div class='columns is-mobile is-multiline'>

            <!-- owned subject -->
            <div class="column is-3-desktop is-6-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={100} class='has-background-primary has-text-white fredokaone txt-size-30'>
                    {data.ownedSubjectsCount}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} maxmins-w-100p centerxy'>
                  Created subject{data.ownedSubjectsCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- owned workspaces -->
            <div class="column is-3-desktop is-6-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={100} class='has-background-info has-text-white fredokaone txt-size-30'>
                    {data.ownedWorkspacesCount}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} maxmins-w-100p centerxy'>
                  Created workspace{data.ownedWorkspacesCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- joined workspaces -->
            <div class="column is-3-desktop is-6-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={100} class='has-background-success has-text-white fredokaone txt-size-30'>
                    {data.joinedWorkspacesCount}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} maxmins-w-100p centerxy'>
                  Joined in workspace{data.joinedWorkspacesCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- created tasks -->
            <div class="column is-3-desktop is-6-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={100} class='has-background-link has-text-white fredokaone txt-size-30'>
                    {data.createdTasksCount}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} maxmins-w-100p centerxy'>
                  Created task{data.createdTasksCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- assigned tasks -->
            <div class="column is-3-desktop is-6-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={100} class='has-background-link-light has-text-grey-dark fredokaone txt-size-30'>
                    {data.assignedTasksCount}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} maxmins-w-100p centerxy'>
                  Assigned task{data.assignedTasksCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- favorite subjects -->
            <div class="column is-3-desktop is-6-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={100} class='has-background-warning-light has-text-grey-dark fredokaone txt-size-30'>
                    {data.favoriteSubjectsCounts}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} maxmins-w-100p centerxy'>
                  Favorite subject{data.favoriteSubjectsCounts > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- favorite workspaces -->
            <div class="column is-3-desktop is-6-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={100} class='has-background-danger-light has-text-grey-dark fredokaone txt-size-30'>
                    {data.favoriteWorkspacesCounts}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} maxmins-w-100p centerxy'>
                  Favorite workspace{data.favoriteWorkspacesCounts > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- favorite tasks -->
            <div class="column is-3-desktop is-6-touch">
              <div class='maxmins-w-100p is-flex is-flex-wrap-wrap'>
                <div class='maxmins-w-100p centerxy'>
                  <Avatar size={100} class='has-background-success-light has-text-grey-dark fredokaone txt-size-30'>
                    {data.favoriteTasksCounts}
                  </Avatar>
                </div>
                <div class='fredoka-reg txt-size-{innerWidth < 571 ? '14' : '18'} maxmins-w-100p centerxy'>
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
          <div class='column is-12 mt-2'>
            <TextField
              outlined
              bind:value={data.user.email}
              readonly
              error={!data.user.verified}
              messages={!data.user.verified ? ['Unverified | Click send to resend verification mail'] : []}
              color='indigo darken-4'
              class='fredoka-reg'
            >
              <div slot='prepend'>
                <Icon path={mdiEmail} />
              </div>
              Email
              <div slot='append'>
                {#if !data.user.verified}
                  <Tooltip bottom>
                    <Button icon>
                      <Icon path={mdiSendOutline} />
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

          <div class='column is-12 pb-0'>
            <TextField
              outlined
              type='password'
              bind:value={data.user.password}
              readonly
              color='indigo darken-4'
              class='fredoka-reg'
            >
              <div slot='prepend'>
                <Icon path={mdiKey} />
              </div>
              Password
            </TextField>
          </div>
          <div class="column is-12 pt-0">
            <div class='maxmins-w-100p is-flex is-justify-content-flex-end'>
              <Button text size='small' class='has-background-grey has-text-white '>
                Change password
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
              <div style='border-right: 1px solid rgba(0, 0, 0, 0.1)' class='pr-2 fredoka-reg txt-size-{innerWidth < 571 ? '13' : ''} maxmins-w-80p'>
                Allow other users to invite you in their workspaces, making you visible to public. Turning this off will make your account private except to the workspaces you're already in and other users can't invite you.
              </div>

              <Switch class='pl-3' color='green' inset bind:checked={data.user.canBeInvited}></Switch>
            </div>
          </div>
          
          <!-- showTutorial -->
          {#if data.user.showTutorial}
            <div class='column is-12 mt-3'>
              <div class='fredoka-reg tag'>
                Show tutorial
              </div>
              <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between pl-6">
                <div style='border-right: 1px solid rgba(0, 0, 0, 0.1)' class='fredoka-reg txt-size-{innerWidth < 571 ? '13' : ''} maxmins-w-80p'>
                  Allow axion to guide you by showing tutorials in every pages. Turning this off will result to forever disabling this option.
                </div>

                <Switch class='pl-3' color='green' inset bind:checked={data.user.showTutorial}></Switch>
              </div>
            </div>
          {/if}
          
          <!-- showStatistics -->
          <div class='column is-12 mt-3'>
            <div class='fredoka-reg tag'>
              Show statistics
            </div>
            <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between pl-6">
              <div style='border-right: 1px solid rgba(0, 0, 0, 0.1)' class='pr-2 fredoka-reg txt-size-{innerWidth < 571 ? '13' : ''} maxmins-w-80p'>
                Enabling this will display a statistics of your current progresses globally to all your subjects. Turning this off will not display and also reduce data being fetch and processes.
              </div>

              <Switch class='pl-3' color='green' inset bind:checked={data.user.showStatistics}></Switch>
            </div>
          </div>
          
          <!-- showHints -->
          <div class='column is-12 mt-3'>
            <div class='fredoka-reg tag'>
              Show mini hints
            </div>
            <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between pl-6">
              <div style='border-right: 1px solid rgba(0, 0, 0, 0.1)' class='pr-2 fredoka-reg txt-size-{innerWidth < 571 ? '13' : ''} maxmins-w-80p'>
                Show short hints on the bottom part of the screen. Turning this off will show the Axion and its version instead.
              </div>

              <Switch class='pl-3' color='green' inset bind:checked={data.user.footerHints}></Switch>
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

              <Button text class='has-text-white has-background-danger' size='{innerWidth < 571 ? 'x-small' : 'small'}'>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- left side -->
  <div class="column pos-fix pos-r-0 is-2-desktop is-4-tablet is-0-mobile is-hidden-mobile" style="border-left: 1px solid rgba(0, 0, 0, 0.3)">
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