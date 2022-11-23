<script>
  //@ts-nocheck
  import { activeBoard } from '$lib/stores/boards.store';
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems, navDrawerActive, notifCenterOpen } from '$lib/stores/global.store';
	import { activeTask } from '$lib/stores/task.store';
	import { mdiAccountOutline,mdiAccountPlusOutline, mdiCancel, mdiChat,mdiCheck,mdiChevronDown,mdiChevronUp,mdiClose,mdiCogOutline,mdiEyeOutline,mdiFileUpload,mdiFilter, mdiLeadPencil,mdiMagnify,mdiPencil,mdiPlus,mdiSend,mdiSourceBranch,mdiStar, mdiStarOutline, mdiText, mdiTrashCan } from '@mdi/js';
	import { onMount } from 'svelte';
  import { Icon, Avatar, MaterialApp, Tabs, Tab, Divider, Checkbox, Window, WindowItem, Textarea, Button, ClickOutside, TextField, Badge, Select } from 'svelte-materialify'
  import SveltyPicker from 'svelty-picker'


  /** 
   * @type {import('./$types').PageServerData}
   * */
  export let data

  /**
   * @type {{name: string, id: string, color: string}[]}
   */
  let statuses = []
  let innerWidth = 0
  let currentWindow = 0
  let oldDescriptionValue = ''
  let description = ''
  let showOptions = false
  let showStatuses = false
  let showLevels = false
  let showFavorites = false
  let showSubCount = false
  let showViewers = false
  let currentLevel = 0
  let currentFav = 0
  let levelHoverings = false
  let favHoverings = false
  let newStatus = {
    id: '',
    name: '',
    color: ''
  }
  let hoverings = false
  let chatHoverings = false
  let currentAstatus = ''
  let currentChat = ''
  let chatEditing = false
  let editedChatText = ''
  let chatInput = ''
  let addPanelOpen = false
  let taskNameEditing = false
  let newTaskName = data.task.name
  let subtaskHoverings = false
  let currentSubtask = ''
  let addSubtaskPanelOpen = false
  let addSubtaskAssigneeDropOpen = false
  let group = []

  $: month = parseInt($activeTask.dueDateTime.toISOString().split('T')[0].split('-')[1])
  $: hour = parseInt($activeTask.dueDateTime.toISOString().split('T')[1].split('-')[0])
  $: innerWidth > 769 ? showOptions = false : null

  /**
   * @param {{id: string, name: string, color: string}} Astatus
   * @param {boolean} ent
  */
  const hovering = (Astatus, ent) => {
    if(ent) {
      hoverings = true
      currentAstatus = Astatus.id
    }else{
      hoverings = false
      currentAstatus = ''
    }
  }

  /**
   * @param {number} level
   * @param {boolean} colliding
   */
  const levelHovering = (level, colliding) => {
    if(colliding) {
      levelHoverings = true
      currentLevel = level
    }else{
      levelHoverings = false
      currentLevel = 0
    }
  }
 
  /**
   * @param {number} fav
   * @param {boolean} colliding
   */
  const favHovering = (fav, colliding) => {
    if(colliding) {
      favHoverings = true
      currentFav  = fav
    }else{
      favHoverings = false
      currentFav  = 0
    }
  }
 
  /**
   * @param {string} id
   * @param {boolean} colliding
   */
  const chatHovering = (id, colliding) => {
    if(colliding) {
      chatHoverings = true
      currentChat  = id
    }else{
      chatHoverings = false
      currentChat  = ''
    }
  }

  /**
   * @param {string} id
   * @param {boolean} colliding
   */
  const subtaskHovering = (id, colliding) => {
    if(colliding) {
      subtaskHoverings = true
      currentSubtask  = id
    }else{
      subtaskHoverings = false
      currentSubtask  = ''
    }
  }
 
  /**
   * @param {string} id
   * @param {boolean} editing
   */
  const chatEdit = (id, editing) => {
    if(editing) {
      chatEditing = true
      currentChat  = id
      editedChatText = data.chats.filter(chat => chat.id === id)[0].message
      chatHoverings = true
    }else{
      chatEditing = false
      currentChat  = ''
      editedChatText = ''
    }
  }

  /**
   * @param {string} isoDate
   * @return {string} Date
   */
  const getDate = (isoDate) => {
		let dueDate = ''

		const [dateValue, timeValue] = isoDate.split('T');
		const [year, month, date] = dateValue.split('-');
		const [hour, minute, other] = timeValue.split(':');

		switch (month) {
			case '01':
				dueDate += 'Jan';
				break;
			case '02':
				dueDate += 'Feb';
				break;
			case '03':
				dueDate += 'Mar';
				break;
			case '04':
				dueDate += 'Apr';
				break;
			case '05':
				dueDate += 'May';
				break;
			case '06':
				dueDate += 'Jun';
				break;
			case '07':
				dueDate += 'Jul';
				break;
			case '08':
				dueDate += 'Aug';
				break;
			case '09':
				dueDate += 'Sep';
				break;
			case '10':
				dueDate += 'Oct';
				break;
			case '11':
				dueDate += 'Nov';
				break;
			case '12':
				dueDate += 'Dec';
				break;
		}

		let finalHour = parseInt(hour);
		switch (finalHour) {
			case 13:
				finalHour = 1;
				break;
			case 14:
				finalHour = 2;
				break;
			case 15:
				finalHour = 3;
				break;
			case 16:
				finalHour = 4;
				break;
			case 17:
				finalHour = 5;
				break;
			case 18:
				finalHour = 6;
				break;
			case 19:
				finalHour = 7;
				break;
			case 20:
				finalHour = 8;
				break;
			case 21:
				finalHour = 9;
				break;
			case 22:
				finalHour = 10;
				break;
			case 23:
				finalHour = 11;
				break;
			case 24:
				finalHour = 0;
				break;
			case 0:
				finalHour = 0;
				break;
			default:
				finalHour = finalHour;
		}

		return `${dueDate} ${date} ${finalHour}:${minute} ${parseInt(hour) > 11 ? 'PM' : 'AM'}`;
	}

  onMount(() => {
    activeSubject.set(data.subject)
    activeWorkspace.set(data.workspace)
    activeBoard.set(data.board)
    activeTask.set(data.task)
    $breadCrumbsItems = [
      {text: data.subject.name, href: `/${data.user.email}`},
      {text: data.workspace.name, href: `/${data.user.email}/${data.subject.id}`},
      {text: data.board.name, href: `/${data.user.email}/${data.subject.id}/${data.workspace.id}`},
      {text: data.task.name, href: `/${data.user.email}/${data.subject.id}/${data.workspace.id}/${data.board.id}`},
      {text: 'view', href: '#'}
    ]
    oldDescriptionValue = data.task.description
    description = data.task.description
    newStatus = {
      id: data.board.id,
      name: data.board.name,
      color: data.board.color
    }
    statuses = data.statuses
  })
</script>

<svelte:window bind:innerWidth />

<svelte:head>
  <title>{$activeTask.name}</title>
</svelte:head>

<div>
  <div class="columns is-mobile is-multiline is-relative">
    <!-- right side -->
    <div style="transform-origin: top center; border-top: 1px solid rgba(0, 0, 0, 0.3)" class='has-background-white column is-8-desktop is-6-tablet is-12-mobile has-transition {innerWidth > 768 ? '' : $navDrawerActive || $notifCenterOpen ? '' : 'z-15'} {showOptions ? 'rot-x-90 pos-abs' : 'rot-x-0'}'>
  
      <!-- name, level, favorite, subtasks count, options -->
      <div class="columns is-mobile is-multiline">
        <!-- name -->
        <div style='{innerWidth < 769 ? 'border-bottom: 1px solid rgba(0, 0, 0, 0.3); margin-bottom: 3%' : ''}' class="column is-12-mobile is-flex is-justify-content-space-between is-align-items-center">
          <div class="fredoka-reg txt-size-{innerWidth < 571 ? '25' : '40'} has-text-grey-dark is-flex is-align-items-center txt-overflow-ellipsis overflow-x-hidden {taskNameEditing ? 'is-hidden' : ''}">
            {data.task.name}
          </div>

          <input bind:value={newTaskName} style='border: 1px solid rgba(0, 0, 0, 0.3); overflow-x: hidden;' type="text" class="{taskNameEditing ? '' : 'is-hidden'} fredoka-reg txt-size-{innerWidth < 571 ? '25' : '40'} flex-grow-1 rounded has-text-grey-dark is-flex is-align-items-center txt-overflow-ellipsis">

          <div class='{taskNameEditing ? 'is-hidden' : ''}'>
            <Button
              on:click={() => taskNameEditing = true}
              icon
            >
              <Icon size='{innerWidth < 571 ? '15px' : '20px'}' path={mdiPencil} />
            </Button>
          </div>

          <div class="is-flex is-flex-direction-column {taskNameEditing ? '' : 'is-hidden'}">
            <div class='{newTaskName !== data.task.name ? '' : 'is-hidden'}'>
              <Button icon>
                <Icon size='{innerWidth < 571 ? '15px' : '20px'}' class='has-text-success' path={mdiCheck} />
              </Button>
            </div>

            <div>
              <Button
                icon
                on:click={() => {
                  newTaskName = data.task.name
                  taskNameEditing = false
                }}
              >
                <Icon size='{innerWidth < 571 ? '15px' : '20px'}' class='has-text-danger' path={mdiCancel} />
              </Button>
            </div>
          </div>
        </div>
  
        <!-- level -->
        <div class="column is-narrow-tablet is-3-mobile centerxy is-relative">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- big -->
          <div
            use:ClickOutside
            on:clickOutside={() => {
              if(innerWidth > 768) showLevels = false
            }}
            on:click={() => showLevels = !showLevels}
            class="tags has-addons is-hidden-mobile m-0 is-clickable">
            <div class="tag m-0 is-{data.task.level == 3 ? 'danger' : data.task.level == 2 ? 'warning' : 'success'}">
              Priority
            </div>
            <div class="tag m-0 is-{data.task.level == 3 ? 'danger' : data.task.level == 2 ? 'warning' : 'success'} is-light is-relative">
              {data.task.level == 3 ? 'High' : data.task.level == 2 ? 'Medium' : 'Low'}
              <Icon style='transform: rotateZ({showLevels ? '180' : '0'}deg)' path={mdiChevronDown} />
              
              <div
                style='transform-origin: top center;'
                class="maxmins-w-100p min-h-100p pos-abs pos-r-0 pos-t-100p has-background-white elevation-3 has-transition {$navDrawerActive ? '' : 'z-10'} {showLevels ? 'rot-x-0' : 'rot-x-90'} ">
                {#each Array(3) as l, i}
                  <div
                    on:mouseenter={() => levelHovering(i, true)}
                    on:mouseleave={() => levelHovering(i, false)}
                    on:touchstart={() => levelHovering(i, true)}
                    on:touchend={() => levelHovering(i, false)}
                    class='p-3 has-background-{i+1 == 1 ? 'success' : i+1 == 2 ? 'warning' : 'danger'}-{levelHoverings && currentLevel == i ? 'light' : ''} has-text-grey-dark fredoka-reg'>
                    {i+1 == 1 ? 'Low' : i+1 == 2 ? 'Medium' : 'High'}
                  </div>
                {/each}
              </div>
            </div>

          </div>
  
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- mini -->
          <div
            use:ClickOutside
            on:clickOutside={() => {
              if(innerWidth <= 768) showLevels = false
            }}
            on:click={() => showLevels = !showLevels}
            class="is-hidden-tablet is-clickable tag is-{data.task.level == 3 ? 'danger' : data.task.level == 2 ? 'warning' : 'success'} is-relative">
            {data.task.level == 3 ? 'High' : data.task.level == 2 ? 'Medium' : 'Low'}

            <div
              style='transform-origin: top center'
              class="maxmins-w-100 min-h-100p pos-abs pos-l-0 pos-t-100p has-transition has-background-white elevation-3 {$navDrawerActive ? '' : 'z-10'} {showLevels ? 'rot-x-0' : 'rot-x-90'}">
              {#each Array(3) as l, i}
                <div
                  on:mouseenter={() => levelHovering(i, true)}
                  on:mouseleave={() => levelHovering(i, false)}
                  on:touchstart={() => levelHovering(i, true)}
                  on:touchend={() => levelHovering(i, false)}
                  class='p-3 has-background-{i+1 == 1 ? 'success' : i+1 == 2 ? 'warning' : 'danger'}-{levelHoverings && currentLevel == i ? 'light' : ''}  has-text-grey-dark fredoka-reg'>
                  {i+1 == 1 ? 'Low' : i+1 == 2 ? 'Medium' : 'High'}
                </div>
              {/each}
            </div>
          </div>
          <Divider  vertical class='pos-abs m-0 p-0 pos-t-0 pos-r-0 has-text-grey-light is-hidden-tablet' />
        </div>
  
        <!-- favorite -->
        <div class="column is-narrow-tablet is-3-mobile centerxy is-relative">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- big -->
          <div
            use:ClickOutside
            on:clickOutside={() => {
              if(innerWidth > 768) showFavorites = false
            }}
            on:click={() => showFavorites = !showFavorites}
            class="tags m-0 has-addons is-hidden-mobile is-clickable">
            <div class="tag m-0 is-warning is-unselectable">
              Favorite
            </div>
            <div class="tag m-0 is-warning is-light is-relative">
              {#if data.user.favorites[2].ids.includes(data.task.id)}
                True
              {:else}
                False
              {/if}

              <Icon style='transform: rotateZ({showFavorites ? '180' : '0'}deg)' path={mdiChevronDown} />
              
              <div
                style='transform-origin: top center;'
                class="maxmins-w-100p min-h-100p pos-abs pos-r-0 pos-t-100p has-background-white elevation-3 has-transition {$navDrawerActive ? '' : 'z-10'} {showFavorites ? 'rot-x-0' : 'rot-x-90'} ">
                {#each Array(2) as l, i}
                  <div
                    on:mouseenter={() => favHovering(i, true)}
                    on:mouseleave={() => favHovering(i, false)}
                    on:touchstart={() => favHovering(i, true)}
                    on:touchend={() => favHovering(i, false)}
                    class='p-3 has-background-{i == 0 ? 'success' : 'danger'}-{favHoverings && currentFav == i ? 'light' : ''} has-text-grey-dark fredoka-reg'>
                    {i == 0 ? 'True' : 'False'}
                  </div>
                {/each}
              </div>
            </div>
          </div>
  
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- mini -->
          <div
            use:ClickOutside
            on:clickOutside={() => {
              if(innerWidth <= 768) showFavorites = false
            }}
            on:click={() => showFavorites = !showFavorites}
            class="is-hidden-tablet tag is-light is-relative is-clickable"
          >
            {#if data.user.favorites[2].ids.includes(data.task.id)}
              <Icon class='has-text-warning' path={mdiStar} />
            {:else}
              <Icon class='has-text-warning' path={mdiStarOutline} />
            {/if}

            <div
              style='transform-origin: top center;'
              class="min-w-fit-content min-h-100p pos-abs pos-l-0 pos-t-100p has-background-white elevation-3 has-transition {$navDrawerActive ? '' : 'z-10'} {showFavorites ? 'rot-x-0' : 'rot-x-90'} ">
              {#each Array(2) as l, i}
                <div
                  on:mouseenter={() => favHovering(i, true)}
                  on:mouseleave={() => favHovering(i, false)}
                  on:touchstart={() => favHovering(i, true)}
                  on:touchend={() => favHovering(i, false)}
                  class='p-3 has-background-{i == 0 ? 'success' : 'danger'}-{favHoverings && currentFav == i ? 'light' : ''} has-text-grey-dark fredoka-reg is-clickable'>
                  {i == 0 ? 'True' : 'False'}
                </div>
              {/each}
            </div>
          </div>
          <Divider  vertical class='pos-abs m-0 p-0 pos-t-0 pos-r-0 has-text-grey-light is-hidden-tablet' />
        </div>
  
        <!-- subtasks count -->
        <div class="column is-narrow-tablet is-3-mobile centerxy is-relative">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- big -->
          <div
            use:ClickOutside
            on:clickOutside={() => {
              if(innerWidth > 768) showSubCount = false
            }}
            on:click={() => showSubCount = !showSubCount}
            class="tags m-0 has-addons is-hidden-mobile is-clickable">
            <div class="tag m-0 is-info is-unselectable">
              Subtasks
            </div>
            <div class="tag m-0 is-info is-light is-relative">
              {data.task.subtasks.length}
              
              <div
                style='transform-origin: top center;'
                class="min-w-fit-content min-h-100p pos-abs pos-r-0 pos-t-100p has-background-white elevation-3 has-transition {$navDrawerActive ? '' : 'z-10'} {showSubCount ? 'rot-x-0' : 'rot-x-90'} ">
                <div class='p-3 has-text-grey-dark fredoka-reg'>
                  There {data.task.subtasks.length > 1 ? 'are' : 'is'} {data.task.subtasks.length} subtask{data.task.subtasks.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
  
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- mini -->
          <div
            use:ClickOutside
            on:clickOutside={() => {
              if(innerWidth <= 768) showSubCount = false
            }}
            on:click={() => showSubCount = !showSubCount}
            class="is-hidden-tablet tag is-info is-relative is-clickable">
            {data.task.subtasks.length}

            <div
              style='transform-origin: top center;'
              class="min-w-fit-content min-h-100p pos-abs pos-{innerWidth < 571 ? 'r' : 'l'}-0 pos-t-100p has-background-white elevation-3 has-transition {$navDrawerActive ? '' : 'z-10'} {showSubCount ? 'rot-x-0' : 'rot-x-90'} ">
              <div class='p-3 has-text-grey-dark fredoka-reg'>
                There {data.task.subtasks.length > 1 ? 'are' : 'is'} {data.task.subtasks.length} subtask{data.task.subtasks.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <Divider  vertical class='pos-abs m-0 p-0 pos-t-0 pos-r-0 has-text-grey-light is-hidden-tablet' />
        </div>
  
        <!-- more option -->
        <div class="column is-narrow-tablet is-3-mobile centerxy is-hidden-tablet">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            on:click={() => showOptions = true}
            class="is-hidden-tablet is-clickable">
            <Icon path={mdiCogOutline} />
          </div>
        </div>
      </div>
  
      <!-- due date, created by -->
      <Divider class='m-0' />
      <div class="column is-12">
        <div class="{innerWidth > 570 ? 'is-flex is-align-items-center' : ''} maxmins-w-100p">
          <!-- due date -->
          <div class="fredoka-reg {innerWidth < 571 ? 'txt-size-12' : '20 pr-3'} has-text-grey-dark is-relative">
            Due: {`${month == 1 ? 'Jan' : month == 2 ? 'Feb' : month == 3 ? 'Mar' : month == 4 ? 'Apr' : month == 5 ? 'May' : month == 6 ? 'Jun' : month == 7 ? 'Jul' : month == 8 ? 'Aug' : month == 9 ? 'Sep' : month == 10 ? 'Oct' : month == 11 ? 'Nov' : month == 12 ? 'Dec' : ''} ${$activeTask.dueDateTime.toISOString().split('T')[0].split('-')[2]}, ${$activeTask.dueDateTime.toISOString().split('T')[0].split('-')[0]} ${hour == 13 ? '01' : hour == 14 ? '02' : hour == 15 ? '03' : hour == 16 ? '04' : hour == 17 ? '05' : hour == 18 ? '06' : hour == 19 ? '07' : hour == 20 ? '08' : hour == 21 ? '09' : hour == 22 ? '10' : hour == 23 ? '11' : hour == 24 || hour == 0 ? '12' : hour}:${$activeTask.dueDateTime.toISOString().split('T')[1].split(':')[1]} ${parseInt($activeTask.dueDateTime.toISOString().split('T')[1].split('-')[0]) > 11 ? 'PM': 'AM'}`}
            <Divider  vertical class='pos-abs m-0 pos-t-0 pos-r-0 has-text-grey-light {innerWidth < 571 ? 'is-hidden' : ''}' />
          </div>
    
          <!-- created by -->
          <div class="is-flex is-align-items-center">
            <div class="fredoka-reg {innerWidth < 571 ? 'txt-size-12' : '20 pl-3'} has-text-grey-dark flex-shrink-0">
              Created by
            </div>
            {#if data.createdBy}
              <Avatar style='border: 1px solid rgba(0, 0, 0, 0.3)' class='maxmins-w-20 maxmins-h-20 has-background-white-bis mx-2 is-flex is-justify-content-center is-align-items-center'>
                <div class="fredoka-reg has-text-weight-bold has-text-white txt-size-7 is-flex is-justify-content-center is-align-items-center">
                  {#if !data.createdBy.profile}
                    {`${data.createdBy.firstName} ${data.createdBy.lastName}`.toUpperCase().split(' ')[0].charAt(0)}{`${data.createdBy.firstName} ${data.createdBy.lastName}`.toUpperCase().split(' ')[`${data.createdBy.firstName} ${data.createdBy.lastName}`.toUpperCase().split(' ').length - 1].charAt(0)}
                  {:else}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <img
                      on:click={e => {
                        // currentDP.set(member.profile)
                        // viewDPModalActive.set(true)
                      }}
                      style='object-fit: cover'
                      class="maxmins-w-20 maxmins-h-20 is-clickable"
                      src={data.createdBy.profile}
                      alt={`${data.createdBy.firstName} ${data.createdBy.lastName}`}
                    >
                  {/if}
                </div>
              </Avatar>
            {/if}
            <div class="fredoka-reg {innerWidth < 571 ? 'txt-size-12' : '20'} has-text-grey-dark txt-overflow-ellipsis overflow-x-hidden">
              {#if data.createdBy}
                {`${data.createdBy.firstName} ${data.createdBy.lastName}`}
              {:else}
                (Deleted Account)
              {/if}
            </div>
          </div>
        </div>
      </div>
      <Divider class='m-0' />
  
  
      <!-- desription, chats, subtasks -->
      <div class='column is-12 p-0'>
        <MaterialApp>
          <div>
            {#if innerWidth < 571}
              <Tabs centered showArrows={false} icons class='grey-text' bind:value={currentWindow} fixedTabs>
                <div slot="tabs">
                  <Tab>
                    <Icon path={mdiText} />
                    <div class="fredoka-reg txt-size-10">
                      Description
                    </div>
                  </Tab>
                  <Tab>
                    <Icon path={mdiChat} />
                    <div class="fredoka-reg txt-size-10">
                      Chats
                    </div>
                  </Tab>
                  <Tab>
                    <Icon path={mdiSourceBranch} />
                    <div class="fredoka-reg txt-size-10">
                      Subtasks
                    </div>
                  </Tab>
                </div>
              </Tabs>
            {:else}
              <Tabs showArrows={false} centered grow class='grey-text' bind:value={currentWindow} fixedTabs>
                <div slot='tabs'>
                  <Tab>Description</Tab>
                  <Tab>Chats</Tab>
                  <Tab>Subtasks</Tab>
                </div>
              </Tabs>
            {/if}
    
            <Window value={currentWindow}>
              <!-- description -->
              <WindowItem style='border: 1px solid rgba(0, 0, 0, 0.3)' class='maxmins-h-48v is-relative rounded-b'>
                <Textarea color='grey' autofocus autogrow rows={17} bind:value={description} class='maxmins-h-48v pl-3 fredoka-reg txt-size-{innerWidth < 571 ? '13' : ''}'>
                  {data.task.description ? '' : 'Description'}
                </Textarea>
                <div style='transform-origin: right center' class="{oldDescriptionValue === description ? 'rot-y-n90' : 'rot-y-0'} has-transition is-flex is-justify-content-flex-end is-align-items-center pos-abs pos-b-3p pos-r-0 maxmins-w-100p">
                  <Button
                    depressed
                    size='small'
                    on:click={() => description = oldDescriptionValue}
                  >
                    Cancel
                  </Button>
                  <Button depressed size='small' class='mx-3 has-background-success has-text-white' >
                    Save
                  </Button>
                </div>
              </WindowItem>
    
              <!-- chats -->
              <WindowItem style='border: 1px solid rgba(0, 0, 0, 0.3)' class='maxmins-h-48v rounded-b'>
                <!-- chat container -->
                <div style='overflow-y: auto;' class="maxmins-h-43v maxmins-w-100p">
                  {#each data.chats as chat, i}
                    <div
                      use:ClickOutside
                      on:clickOutside={() => {
                        if(!chatEditing) chatHovering(chat.id, false)
                      }}
                      on:mouseenter={() => {
                        if(!chatEditing) chatHovering(chat.id, true)
                      }}
                      on:mouseleave={() => {
                        if(!chatEditing) chatHovering(chat.id, false)
                      }}
                      on:touchstart={() => {
                        if(!chatEditing) chatHovering(chat.id, true)
                      }}
                      style='{i == 0 || chat.sender !== data.chats[i - 1].sender ? 'border-top: 1px solid rgba(0, 0, 0, 0.3)' : ''}'
                      class="maxmins-w-100p {chatHoverings && currentChat === chat.id ? 'has-background-grey-lighter' : ''} {i == 0 || chat.sender !== data.chats[i - 1].sender ? 'p-2' : 'px-2'} is-flex"
                    >
                      <!-- profile -->
                      <div class='maxmins-w-{innerWidth < 571 ? '40' : '60'}'>
                        {#if i == 0 || chat.sender !== data.chats[i - 1].sender}
                          <Badge active={data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.online} class="success-color" dot bottom offsetX={10} offsetY={10}>
                            <Avatar size='{innerWidth < 571 ? '30px' : '50px'}'>
                              {#if data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.profile !== ''}
                                <img src="{data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.profile}" alt="{data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.firstName}">
                              {:else}
                                <Icon path={mdiAccountOutline} />
                              {/if}
                            </Avatar>
                          </Badge>
                        {/if}
                      </div>

                      <!-- date and message and edited -->
                      <div class="flex-grow-1">
                        <!-- Date -->
                        <div class='txt-size-9 {i == 0 || chat.sender !== data.chats[i - 1].sender ? '' : chatHoverings && currentChat === chat.id ? '' : 'is-hidden'}'>
                          {getDate(chat.deliveredTime.toISOString())} | {data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.firstName} {data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.lastName}
                        </div>

                        <!-- message and editor -->
                        {#if chatEditing && currentChat === chat.id}
                          <input
                            bind:value={editedChatText}
                            name='chatEditor'
                            type="text"
                            class="maxmins-w-100p has-background-white fredoka-reg {innerWidth < 571 ? 'txt-size-13' : ''}"
                            style='border: 1px solid rgba(0, 0, 0, 0.3)'
                          >
                        {:else}
                          <div class="fredoka-reg {innerWidth < 571 ? 'txt-size-13' : ''} is-unselectable">
                            {chat.message}
                          </div>
                        {/if}

                        <!-- edited or not -->
                        <div class="is-italic txt-size-9 fredoka-reg maxmins-w-2v {chat.edited ? '' : 'is-hidden'} px-1 has-background-info-light has-text-grey-dark rounded">
                          Edited
                        </div>
                      </div>

                      <!-- edit button -->
                      <div class='maxmins-w-20 {chatHoverings && currentChat === chat.id ? '' : 'is-hidden'}'>
                        {#if chatEditing && currentChat === chat.id}
                          <Button
                            size='small'
                            icon
                            on:click={() => chatEdit(chat.id, false)}
                          >
                            <Icon size='15px' class='has-text-success' path={mdiCheck} />
                          </Button>
                          <Button
                            size='small'
                            icon
                            on:click={() => chatEdit(chat.id, false)}
                          >
                            <Icon size='15px' class='has-text-danger' path={mdiCancel} />
                          </Button>
                        {:else}
                          <Button
                            size='small'
                            icon
                            on:click={() => chatEdit(chat.id, true)}
                          >
                            <Icon size='15px' style='color: rgba(0, 0, 0, 0.3)' path={mdiLeadPencil} />
                          </Button>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>

                <!-- chat tools -->
                <div style='border-top: 1px solid rgba(0, 0, 0, 0.3)' class='maxmins-w-100p is-flex is-align-items-center maxmins-h-5v'>
                  <!-- upload -->
                  <div class="maxmins-w-50 centerxy">
                    <Button
                      size='small'
                      icon
                    >
                      <Icon class='has-text-info' path={mdiFileUpload} />
                    </Button>
                  </div>

                  <!-- chat input -->
                  <input bind:value={chatInput} name='chatTextField' type="text" placeholder="Type a message" style='border: 1px solid rgba(0, 0, 0, 0.3)' class='flex-grow-1 px-2 py-1 rounded {innerWidth < 571 ? 'txt-size-13' : ''}'>

                  <div class='maxmins-w-50 centerxy'>
                    <Button
                      size='small'
                      icon
                    >
                      <Icon class='has-text-info' path={mdiSend} />
                    </Button>
                  </div>
                </div>
              </WindowItem>
    
              <!-- subtasks -->
              <WindowItem style='border: 1px solid rgba(0, 0, 0, 0.3)' class='maxmins-h-48v rounded-b'>
                <div class="maxmins-w-100p maxmins-h-48v is-relative">
                  <div style='border-bottom: 1px solid rgba(0, 0, 0, 0.3)' class='p-1 maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center has-background-grey'>
                    <div class='fredoka-reg has-text-white {innerWidth < 571 ? 'txt-size-13' : ''}'>
                      Subtask name
                    </div>
                    
                    <div class='tags mb-0 has-addons'>
                      <div class='tag mb-0 is-info'>
                        Priority/level
                      </div>
                      <div class='tag mb-0 is-dark'>
                        Status
                      </div>
                    </div>
                    <!-- <Button size='small' depressed icon={innerWidth < 571 ? true : false}>
                      <Icon size='15px' path={mdiFilter} />
                      <div class='{innerWidth < 571 ? 'is-hidden' : ''}'>
                        Sort
                      </div>
                    </Button> -->
                  </div>
                  {#each data.subtasks as subtask}
                    <a href="{data.task.id}/{subtask.id}">
                      <div
                        on:mouseenter={() => subtaskHovering(subtask.id, true)}
                        on:mouseleave={() => subtaskHovering(subtask.id, false)}
                        style='border-bottom: 1px solid rgba(0, 0, 0, 0.3)' class='maxmins-w-100p is-flex is-align-items-center has-transition px-2 py-{innerWidth < 571 ? '1' : '2'} {subtaskHoverings && currentSubtask === subtask.id ? 'has-background-grey-lighter' : 'has-background-white'}'
                      >
                        <!-- subtask name -->
                        <div style='overflow-x: hidden' class="fredoka-reg has-text-grey-dark max-w-75p txt-overflow-ellipsis {innerWidth < 571 ? 'txt-size-13' : ''}">
                          {subtask.name}
                        </div>
  
                        <div class='flex-grow-1' />
  
                        <div class="tags mb-0 has-addons">
                          <!-- level -->
                          <div class='tag mb-0 fredoka-reg is-info'>
                            {subtask.level == 1 ? 'L' : subtask.level == 2 ? 'M' : 'H'}
                          </div>
  
                          <div class='tag mb-0 fredoka-reg is-{data.statuses.filter(status => status.id === subtask.status)[0].color}'>
                            {data.statuses.filter(status => status.id === subtask.status)[0].name}
                          </div>
                        </div>
                      </div>
                    </a>
                  {/each}

                  <!-- add subtask button -->
                  <div class="pos-abs pos-r-10 pos-b-10">
                    <Button
                      size='{innerWidth < 571 ? 'x-small' : 'small'}'
                      fab={innerWidth < 571 ? true : false}
                      on:click={() => addSubtaskPanelOpen = true}
                    >
                      <Icon path={mdiPlus} />
                      <div class='{innerWidth < 571 ? 'is-hidden' : ''}'>
                        Subtask
                      </div>
                    </Button>
                  </div>
                </div>

              </WindowItem>
            </Window>
          </div>
        </MaterialApp>
      </div>
    </div>
  
    <!-- left side -->
    <div style='border-top: 1px solid rgba(0, 0, 0, 0.3); {innerWidth > 768 ? 'border-bottom: 1px solid rgba(0, 0, 0, 0.3)' : ''}'  class="column is-4-desktop is-6-tablet is-12-mobile {innerWidth > 768 ? 'is-relative' : 'pos-abs pos-t-0'}">
      <Divider  vertical class='pos-abs m-0 p-0 pos-t-0 pos-l-0 has-text-grey-light is-hidden-touch' />
      <!-- show task details -->
      <div class="columns is-hidden-tablet is-clickable">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div on:click={() => showOptions = false} class="column is-12 py-0 centerxy is-flex-wrap-wrap">
          <div>
            <Icon path={mdiChevronUp} />
          </div>
          <div class='maxmins-w-100p centerxy fredoka-reg txt-size-11'>
            Back to task details
          </div>
        </div>
      </div>
      <Divider class='m-0 {innerWidth > 768 ? 'is-hidden' : ''}' />
  
      <!-- status and viewers -->
      <div class="columns is-mobile is-multiline">
        <!-- status -->
        <div class="column is-9-touch {innerWidth < 769 ? 'pr-0' : ''}">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            use:ClickOutside
            on:clickOutside={() => showStatuses = false}
            on:click={() => showStatuses = !showStatuses}
            class='mt-4 tags has-addons is-clickable'>
            <div class='tag {innerWidth < 769 ? 'px-1' : ''} mb-0 is-{data.board.color} fredoka-reg'>
              Status
            </div>
            <div class="flex-grow-1 tag {innerWidth < 769 ? 'pr-0' : ''} mb-0 is-{newStatus.color} is-light is-relative">
              <div class="maxmins-w-100p is-clickable is-flex is-align-items-center is-justify-content-space-between">
                <div class="fredoka-reg">
                  {newStatus.name}
                </div>
  
                <div>
                  <Icon style='transform: rotateZ({showStatuses ? '180' : '0'}deg)' path={mdiChevronDown} />
                </div>
  
              </div>
              <div style="transform-origin: top center;" class="{$navDrawerActive ? '' : 'z-2'} pos-abs pos-l-0 pos-t-100p has-background-white elevation-3 maxmins-w-100p has-transition {showStatuses ? 'rot-x-0' : 'rot-x-90'}">
                {#each statuses as Astatus}
                  <div
                    on:mouseenter={() => hovering(Astatus, true)}
                    on:touchstart={() => hovering(Astatus, true)}
                    on:mouseleave={() => hovering(Astatus, false)}
                    on:touchend={() => hovering(Astatus, false)}
                    class='maxmins-w-100p p-3 has-text-grey-dark {hoverings && currentAstatus === Astatus.id ? `has-background-${Astatus.color}-light has-background-${Astatus.color}-lighter` : ''} fredoka-reg is-clickable'>
                    {Astatus.name}
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
        
        <!-- viewers -->
        <div class="column is-3-touch">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            use:ClickOutside
            on:clickOutside={() => showViewers = false}
            on:click={() => showViewers = !showViewers}
            class='mt-4 tags has-addons is-clickable'>
            <div class='tag {innerWidth < 769 ? 'px-1' : ''} mb-0 is-dark fredoka-reg is-unselectable'>
              <Icon class='has-text-white' path={mdiEyeOutline} />
            </div>
            <div class="{innerWidth < 769 ? 'flex-grow-1 pr-1' : ''} is-unselectable tag mb-0 is-grey is-light is-relative">
              <div class="maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between">
                <div class="fredoka-reg">
                  {data.viewers.length}
                </div>  
              </div>
              
              <!-- List -->
              <div style="transform-origin: top center;" class="{$navDrawerActive ? '' : 'z-2'} pos-abs pos-r-0 pos-t-100p has-background-white elevation-3 min-w-fit-content has-transition {showViewers ? 'rot-x-0' : 'rot-x-90'}">
                {#each data.viewers as viewer}
                  <div class='maxmins-w-100p p-3 is-flex is-align-items-center is-justify-content-center'>
                    <div class='maxmins-w-20p'>
                      <Avatar>
                        <img src="{viewer.profile}" alt="{viewer.firstName} {viewer.lastName}">
                      </Avatar>
                    </div>
                    <div class="flex-grow-1 ml-3">
                      {viewer.firstName} {viewer.lastName}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

          </div>
        </div>
      </div>
      <Divider class='mb-0' />
  
      <!-- Assignee/s label and add button -->
      <div class="columns my-0">
        <div class="column is-12">
          <div class='maxmins-w-100p is-flex is-align-items-center is-justify-content-space-between'>
            <div class='fredoka-reg'>
              Assignee/s
            </div>
    
            <Button
              depressed
              icon={innerWidth < 571}
              size='small'
              class='has-background-grey-lighter'
              on:click={() => addPanelOpen = true}
            >
              {#if innerWidth < 571}
                <Icon path={mdiAccountPlusOutline} />
              {:else}
                Add
              {/if}
            </Button>
          </div>
        </div>
      </div>
      <Divider class='mt-0 p-0' />
  
      <!-- Assignees Card -->
      <div
        style='overflow-y: auto'
        class="columns maxmins-h-48v">
        <!-- loop here -->
        {#each data.members as member}  
          <div class="column is-12">
            <div style="overflow: hidden;" class="maxmins-w-100p rounded-lg maxmins-h-65 has-background-white elevation-1 is-flex">
              <div class="maxmins-w-20p flex-shrink-0 has-background-grey-lighter centerxy">
                <Badge class='success-color' dot bottom offsetX={10} offsetY={10} active={member.online}>
                  <Avatar class='has-background-white'>
                    {#if member.profile}
                      <img src="{member.profile}" alt="{`${member.firstName} ${member.lastName}`}">
                    {:else}
                      <Icon class='has-text-info' path={mdiAccountOutline} />
                    {/if}
                  </Avatar>
                </Badge>
              </div>
              <div class="flex-grow-1 is-flex is-flex-direction-column pl-2 is-justify-content-center">
                <div class="fredoka-reg is-size-7 maxmins-w-100p txt-overflow-ellipsis overflow-x-hidden">
                  {member.firstName} {member.lastName}
                </div>
                <div class='fredoka-reg txt-size-13 maxmins-w-100p txt-overflow-ellipsis overflow-x-hidden'>
                  {member.email}
                </div>
              </div>
              <div class="maxmins-w-6p centerxy mr-2">
                <Button icon>
                  <Icon class='red-text' path={mdiClose} />
                </Button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- delete Task -->
      <div class="column pos-fix pos-b-100 pos-l-0 maxmins-w-100p min-h-10">
        <div class="maxmins-w-100p is-flex is-justify-content-flex-end is-align-items-center">
          <Button size='small' depressed class='has-background-danger has-text-white' >
            <Icon path={mdiTrashCan} />
            <div class='ml-3'>
              Delete task
            </div>
          </Button>
        </div>
      </div>
    </div>
  </div>

  <!-- add assignee panel -->
  <div class="has-transition z-89 pos-fix p-2 pos-t-57 pos-r-0 maxmins-h-calc-100vh-65px maxmins-w-400-dt-to-mb-100p has-background-white-bis {!addPanelOpen ? innerWidth < 571 ? 'rot-x-90' : 'rot-y-90': innerWidth < 571 ? 'rot-x-0' : 'rot-y-0'} rounded-b elevation-4 is-flex is-flex-direction-column" style='transform-origin: top right'>
    <!-- title -->
    <div class='maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center'>
      <div class='fredoka-reg is-size-6'>
        Add assignee
      </div>
      
      <Button
        icon
        on:click={() => addPanelOpen = false}
      >
        <Icon class='has-text-danger' path={mdiClose} />
      </Button>
    </div>

    <!-- search bar -->
    <div class="maxmins-w-100p mt-3">
      <MaterialApp>
        <div class="has-background-white-bis">
          <TextField color='grey' rounded outlined dense class='fredoka-reg' hint='ex. Juan De Tamado or juanTamad0@gmail.com'>
            Name or email
            <div slot='append' class='is-clickable'>
              <Icon path={mdiMagnify} />
            </div>
          </TextField>
        </div>
      </MaterialApp>
    </div>

    <Divider class='mb-3' />

    <div class='fredoka-reg'>
      Workspace member{data.workspaceMembers.length > 1 ? 's' : ''}
    </div>
    <!-- list of workspace members -->
    <div style='overflow-y: auto;' class='maxmins-w-100p flex-grow-1 px-2 py-1 rounded'>
      {#each data.workspaceMembers as wm}
        <div class="maxmins-w-100p">
          <div style="overflow: hidden;" class="maxmins-w-100p has-background-white elevation-1 rounded-lg maxmins-h-65 is-flex">
            <div class="maxmins-w-20p flex-shrink-0 centerxy">
              <Badge class='success-color' dot bottom offsetX={10} offsetY={10} active={wm.online}>
                <Avatar class='has-background-white'>
                  {#if wm.profile}
                    <img src="{wm.profile}" alt="{`${wm.firstName} ${wm.lastName}`}">
                  {:else}
                    <Icon class='has-text-info' path={mdiAccountOutline} />
                  {/if}
                </Avatar>
              </Badge>
            </div>
            <div class="flex-grow-1 is-flex is-flex-direction-column pl-2 is-justify-content-center">
              <div class="fredoka-reg is-size-7 maxmins-w-100p txt-overflow-ellipsis overflow-x-hidden">
                {wm.firstName} {wm.lastName}
              </div>
              <div class='fredoka-reg txt-size-13 maxmins-w-100p txt-overflow-ellipsis overflow-x-hidden'>
                {wm.email}
              </div>
            </div>
            <div class="maxmins-w-6p centerxy mr-2">
              <Button icon size='x-small'>
                <Icon size='20px' path={mdiPlus} />
              </Button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- add Subtask panel -->
  <div class="has-transition z-89 pos-fix p-2 pos-t-57 pos-r-0 maxmins-h-calc-100vh-65px maxmins-w-400-dt-to-mb-100p has-background-white-bis {!addSubtaskPanelOpen ? innerWidth < 571 ? 'rot-x-90' : 'rot-y-90': innerWidth < 571 ? 'rot-x-0' : 'rot-y-0'} rounded-b elevation-4 is-flex is-flex-direction-column" style='transform-origin: top right'>
    <!-- title -->
    <div class='maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center'>
      <div class='fredoka-reg is-size-6'>
        Add subtask
      </div>
      
      <Button
        icon
        on:click={() => addSubtaskPanelOpen = false}
      >
        <Icon class='has-text-danger' path={mdiClose} />
      </Button>
    </div>

    <!-- task name -->
    <div class="maxmins-w-100p mt-3">
      <MaterialApp>
        <div class="has-background-white-bis">
          <TextField color='grey' outlined dense class='fredoka-reg' hint='ex. Revise thesis paper'>
            Task name
          </TextField>
        </div>
      </MaterialApp>
    </div>
    
    <!-- task description -->
    <div class="maxmins-w-100p mt-3">
      <MaterialApp>
        <div class="has-background-white-bis">
          <Textarea rows={2} hint='ex. Take IT{'\''}s technical advices' outlined color='grey' >
            Description
          </Textarea>
        </div>
      </MaterialApp>
    </div>
    
    <!-- task level -->
    <div class="maxmins-w-100p mt-3">
      <MaterialApp>
        <div class="has-background-white-bis">
          <Select hint='Low, Medium or High' dense outlined items={[{name: 'Low', value: 1}, {name: 'Medum', value: 2}, {name: 'High', value: 3}]}>
            Priority
          </Select>
        </div>
      </MaterialApp>
    </div>

    <!-- task status -->
    <div class="maxmins-w-100p mt-3">
      <MaterialApp>
        <div class="has-background-white-bis">
          <Select hint='Sets the status of this task' dense outlined items={data.statuses.map(status => {return {name: status.name, value: status.id}})}>
            Status
          </Select>
        </div>
      </MaterialApp>
    </div>


    <div class="maxmins-w-100p mt-3">
      <div style='border: 1px solid rgba(0, 0, 0, 0.4); overflow: hidden;' class='rounded'>
        <SveltyPicker
            placeholder="Due date"
            inputClasses="maxmins-w-100p rounded p-2"
            format="yyyy-mm-dd hh:ii"
        />
      </div>
      <div class='fredoka-reg txt-size-11 has-text-grey mt-1'>
        ex. 2022-11-23 11:59
      </div>
    </div>

    <!-- task assignee/s -->
    <div class="maxmins-w-100p mt-3 is-relative">
      <MaterialApp>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div use:ClickOutside on:clickOutside={() => addSubtaskAssigneeDropOpen = false} on:click={() => addSubtaskAssigneeDropOpen = !addSubtaskAssigneeDropOpen} class="has-background-white-bis">
          <TextField color='grey' outlined dense class='fredoka-reg' hint='ex. Revise thesis paper'>
            Assignee/s
          </TextField>
        </div>
      </MaterialApp>

      <div style='overflow-y: auto; transform-origin: top center;' class="pos-abs pos-l-0 pos-t-70p rounded maxmins-w-100p max-h-30v has-background-white elevation-2 p-2 has-transition rot-x-{addSubtaskAssigneeDropOpen ? '0' : '90'}">
        {#each data.workspaceMembers as wm}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div on:click={() => addSubtaskAssigneeDropOpen = true}>
            <Checkbox color='green' bind:group value="{wm.id}">
              <div class='maxmins-w-100p is-flex is-align-items-center'>
                <div>
                  <Avatar size='18px'>
                    <img src="{wm.profile}" alt="{wm.lastName}">
                  </Avatar>
                </div>
                
                <div class="ml-3 fredoka-reg has-text-grey">
                  {wm.firstName} {wm.lastName}
                </div>
              </div>
            </Checkbox>
          </div>
        {/each}
      </div>
    </div>

    <div class='maxmins-w-100p flex-grow-1 is-flex is-flex-direction-column is-justify-content-flex-end'>
      <div class='maxmins-w-100p is-flex is-justify-content-flex-end'>
        <Button depressed class='has-background-grey-light has-text-white'>
          Create
        </Button>
      </div>
    </div>

  </div>
</div>