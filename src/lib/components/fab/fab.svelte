<script>
  //@ts-nocheck
	import { addBoardModalActive } from '$lib/stores/boards.store';
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems, hintText, modalChosenColor } from '$lib/stores/global.store';
	import { addSubjectPanelActive } from '$lib/stores/subject.store';
	import { addTaskPanelActive, addWorkspacePanelActive, leaveWorkspacePanelActive, manageAdminPanelActive, manageMembersPanelActive, viewMembersNow, workspaceSettingsPanelActive } from '$lib/stores/workspace.store';
	import { mdiAccountArrowUp, mdiAccountGroup, mdiAccountPlus, mdiAccountSettings, mdiAccountSupervisor, mdiApplicationSettings, mdiApplicationSettingsOutline, mdiExitRun, mdiPlus, mdiPlusBox, mdiServerPlus, mdiTeamviewer, mdiTextBoxPlus, mdiTextBoxPlusOutline } from '@mdi/js';
  import { Menu, Button, Icon, List, ListItem } from 'svelte-materialify'
  import { fade, scale } from 'svelte/transition'

  export let data

  let fabActive = false
  let innerWidth = 0

  /**
   * @param {string} cs
   */
  const setHint = (cs) => {
    switch(cs) {
      case 'c-s':
        hintText.set('Creates a new subject')
        break
      case 'c-w':
        hintText.set(`Creates a new workspace in ${$activeSubject.name} subject`)
        break
      case 's-s':
        hintText.set(`Access the settings of ${$activeSubject.name} subject`)
        break
      case 'c-t':
        hintText.set('Creates a new task')
        break
      case 'c-b':
        hintText.set('Creates a new status board')
        break
      case 'v-m':
        hintText.set('View all workspace member/s')
        break
      case 'm-m':
        hintText.set(`Add or remove a member in ${$activeWorkspace.name} workspace`)
        break
      case 'm-a':
        hintText.set(`Add or remove admin in ${$activeWorkspace.name} workspace`)
        break
      case 'w-s':
        hintText.set(`Access the settings of ${activeWorkspace.name} workspace`)
        break
      case 'l':
        hintText.set('Remove yourself as a member on this workspace')
        break
    }
  }
</script>

<svelte:window bind:innerWidth />

<div class="has-transition pos-abs { innerWidth < 426 ? "pos-b-20 pos-r-20" : "pos-b-40 pos-r-45"}">
  <Menu right bind:active={fabActive} bottom closeOnClick transition={scale} inOpts="{{start: 0, duration: 100}}" style='overflow-y: hidden;'>
    <div slot="activator">
      <Button fab depressed class='has-background-primary'>
        <Icon class='white-text' path={mdiPlus} rotate={fabActive ? 45 : 0} />
      </Button>
    </div>
    <List rounded class='fredoka-reg'>
      {#if $breadCrumbsItems[0].text === "Subjects"}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          on:mouseenter={() => setHint('c-s')}
          on:click={e => addSubjectPanelActive.set(true)}
        >
          <ListItem>
            <span slot="prepend">
              <Icon path={mdiTextBoxPlusOutline} />
            </span>
            Create subject
          </ListItem>
        </div>
      {:else if $breadCrumbsItems.length == 1}
        {#if $activeSubject.owner === data.user.id}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            on:mouseenter={() => setHint('c-w')}
            on:click={e => addWorkspacePanelActive.set(true)}>
            <ListItem>
              <span slot="prepend">
                <Icon path={mdiPlusBox} />
              </span>
              Create workspace
            </ListItem>
          </div>
        {/if}

        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          on:mouseenter={() => setHint('s-s')}
          on:click={e => {
            modalChosenColor.set($activeSubject.color)
            // subjectSettingsModalActive.set(true) -> change this to goto() where subject settings resides
          }}
        >
          <ListItem>
            <span slot="prepend">
              <Icon path={mdiApplicationSettingsOutline} />
            </span>
            Subject settings
          </ListItem>
        </div>
      {:else}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          on:mouseenter={() => setHint('c-t')}
          on:click={() => addTaskPanelActive.set(true)}>
          <ListItem>
            <span slot="prepend">
              <Icon path={mdiTextBoxPlus} />
            </span>
            Create task
          </ListItem>
        </div>
        {#if data.user.verified}
          {#if $activeSubject.owner === data.user.id || $activeWorkspace.admins.filter(admin => admin.id === data.user.id).length != 0}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
              on:mouseenter={() => setHint('c-b')}
              on:click={e => addBoardModalActive.set(true)}>
              <ListItem>
                <span slot="prepend">
                  <Icon path={mdiServerPlus} />
                </span>
                Create board
              </ListItem>
            </div>
          {/if}

          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            on:mouseenter={() => setHint('v-m')}
            on:click={() => viewMembersNow.set(true)}>
            <ListItem>
              <span slot="prepend">
                <Icon path={mdiAccountGroup} />
              </span>
              View members
            </ListItem>
          </div>

          
          {#if $activeSubject.owner === data.user.id || $activeWorkspace.admins.filter(admin => admin.id === data.user.id).length != 0}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
              on:mouseenter={() => setHint('m-m')}
              on:click={() => manageMembersPanelActive.set(true)}>
              <ListItem>
                <span slot="prepend">
                  <Icon path={mdiAccountSettings} />
                </span>
                Manage members
              </ListItem>
            </div>

            {#if $activeWorkspace.members.filter(member => member.id !== data.user.id).length != 0}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <div
                on:mouseenter={() => setHint('m-a')}
                on:click={e => manageAdminPanelActive.set(true)}>
                <ListItem>
                  <span slot="prepend">
                    <Icon path={mdiAccountSupervisor} />
                  </span>
                  Manage admins
                </ListItem>
              </div>
            {/if}
            
          {/if}
        {/if}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          on:mouseenter={() => setHint('w-s')}
          on:click={e => workspaceSettingsPanelActive.set(true)}>
          <ListItem>
            <span slot="prepend">
              <Icon path={mdiApplicationSettings} />
            </span>
            Workspace settings
          </ListItem>
        </div>

        {#if $activeSubject.owner !== data.user.id}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            on:mouseenter={() => setHint('l')}
            on:click={e => leaveWorkspacePanelActive.set(true)}>
            <ListItem class='has-text-danger-dark'>
              <span slot="prepend">
                <Icon path={mdiExitRun} />
              </span>
              Leave workspace
            </ListItem>
          </div>
        {/if}
      {/if}
    </List>
  </Menu>
</div>