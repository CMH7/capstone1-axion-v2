<script>
  //@ts-nocheck
	import { confirmationDemoteWorkspaceAdminModalActive, confirmationPromoteWorkspaceMemberModalActive, confirmationRemoveWorkspaceMemberModalActive, selectedMember, workspaceInviteUserModalActive } from '$lib/stores/workspace.store';
	import { mdiAccountOutline } from '@mdi/js';
  import { Card, Icon, CardTitle, CardSubtitle, CardActions, Button } from 'svelte-materialify'

  export let data
  export let member = {
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    online: false,
    profile: '',
    gender: ''
  }

  const removeMember = () => {
    selectedMember.set(member)
    confirmationRemoveWorkspaceMemberModalActive.set(true)
  }

  const dpi = () => {
    selectedMember.set(member)
    if(data.workspace.admins.includes(member.id)) {
      confirmationDemoteWorkspaceAdminModalActive.set(true)
    } else if(!data.workspace.admins.includes(member.id) && data.workspace.members.includes(member.id)) {
      confirmationPromoteWorkspaceMemberModalActive.set(true)
    } else {
      workspaceInviteUserModalActive.set(true)
    }
  }
</script>

<div class="column is-2-desktop is-4-tablet is-12-mobile">
  <Card class='is-relative'>
    <div class="pos-abs pos-l-0 pos-t-0 maxmins-w-100p">
      <div class='maxmins-w-100p is-flex is-align-items-center is-justify-content-flex-end py-1 px-2 has-background-white'>
        <div class='fredoka-reg txt-size-13 mr-2 has-text-{member.online ? 'success' : 'grey-light'}'>
          {member.online ? 'Online' : 'Offline'}
        </div>

        <div class='rounded-circle maxmins-w-13 maxmins-h-13 has-background-{member.online ? 'success' : 'grey-light'}' />
      </div>
    </div>

    {#if member.profile !== ''}
      <div class="maxmins-h-200" style='overflow: hidden;'>
        <img class='maxmins-w-100p' src='{member.profile}' alt='{member.firstName} {member.lastName}' />
      </div>
    {:else}
      <div class="is-flex is-justify-content-center maxmins-h-200">
        <Icon size='100%' class='{member.gender === 'Male' ? 'blue' : 'pink'}-text' path={mdiAccountOutline} />
      </div>
    {/if}
    
    <CardTitle>
      <div class='fredoka-reg maxmins-w-100p txt-overflow-ellipsis overflow-x-hidden'>
        {member.firstName} {member.lastName}
      </div>
    </CardTitle>
    <CardSubtitle>
      <div class="fredoka-reg maxmins-w-100p txt-overflow-ellipsis overflow-x-hidden">
        {member.email}
      </div>
      <div class='is-italic fredoka-reg'>
        {data.workspace.admins.includes(member.id) ? data.workspace.owner === member.id ? 'Owner' : 'Admin' : data.workspace.members.includes(member.id) ? 'Member' : 'Verified'}
      </div>
    </CardSubtitle>
    <CardActions>
      <div class="maxmins-w-100p is-flex is-justify-content-space-between">
        <Button
          size='small'
          outlined
          disabled={data.workspace.owner === member.id || !data.workspace.members.includes(member.id)}
          class='{data.workspace.owner === member.id || !data.workspace.members.includes(member.id) ? 'opacity-0p' : ''}'
          on:click={removeMember}
        >
          Remove
        </Button>
        <Button
          size='small'
          outlined
          disabled={data.workspace.owner === member.id}
          class='{data.workspace.owner === member.id ? 'opacity-0p' : ''}'
          on:click={dpi}
        >
          {data.workspace.admins.includes(member.id) ? 'Demote' : data.workspace.members.includes(member.id) ? 'Promote' : 'Invite'}
        </Button>
      </div>
    </CardActions>
  </Card>
</div>