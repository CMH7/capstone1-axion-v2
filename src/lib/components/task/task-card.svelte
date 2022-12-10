<script>
  //@ts-nocheck
	import models from '$lib/models';
	import { boardSettingsPanelActive, newBoardName, selectedBoard } from '$lib/stores/boards.store';
	import { loadingScreen, modalChosenColor } from '$lib/stores/global.store';
	import { newTaskDueDateTime, newTaskLevel, newTaskName, newTaskStatus, selectedTask, statuses, taskSettingsPanelActive } from '$lib/stores/task.store';
  import { Card, Avatar, Tooltip, Divider } from 'svelte-materialify'

  /**
   * @type {
   *  {
        id: string;
        name: string;
        level: number;
        members: string[];
        subtasks: string[];
        dueDateTime: Date;
        status: string;
      }
   * }
   */
  export let task
  export let data
  export let inDone = false

  let show = false
  let timer
  let hold = 0

  /**
   * @param {import('@prisma/client').tasks} task
   * @return {{backgroundColor: string, textColor: string}}
   * */
  const determineBG = (task) => {
    let backgroundColor = ''
    let textColor = 'has-text-success-dark'

    if(task.status === $statuses.filter(status => status.name === 'Done')[0].value || inDone) {
      backgroundColor = 'has-background-success'
      textColor = 'has-text-success-dark'
    }else {
      let date1 = new Date(task.dueDateTime)
      let date2 = new Date()
      let difTime = date1.getTime() - date2.getTime()
      let difDays = difTime / (1000 * 3600 * 24)
      if(difDays < 1 && difDays >= 0) {
        backgroundColor = 'has-background-info'
        textColor = 'has-text-info-light'
      }
      if(difDays < 0 && difDays >= -1) {
        backgroundColor = 'has-background-warning'
        textColor = 'has-text-warning-dark'
      }
      if(difDays < -1 ) {
        backgroundColor = 'has-background-danger'
        textColor = 'has-text-danger-light'
      }
    }

    return {backgroundColor, textColor}
  }

  /**
   * @param {import('@prisma/client').tasks} task
   * @return {{dueDate: string, date: string, finalHour: number, minute: string, hour: string}} dueObject
   * */
  const due = (task) => {
    const [ dateValue, timeValue ] = task.dueDateTime.toISOString().split('T')
    const [ year, month, date ] = dateValue.split('-')
    const [ hour, minute, other ] = timeValue.split(':')

    let dueDate = ''

    switch(month) {
      case '01':
        dueDate += 'Jan'
        break
      case '02':
        dueDate += 'Feb'
        break
      case '03':
        dueDate += 'Mar'
        break
      case '04':
        dueDate += 'Apr'
        break
      case '05':
        dueDate += 'May'
        break
      case '06':
        dueDate += 'Jun'
        break
      case '07':
        dueDate += 'Jul'
        break
      case '08':
        dueDate += 'Aug'
        break
      case '09':
        dueDate += 'Sep'
        break
      case '10':
        dueDate += 'Oct'
        break
      case '11':
        dueDate += 'Nov'
        break
      case '12':
        dueDate += 'Dec'
        break
    }

    let finalHour = parseInt(hour)
    switch(finalHour) {
      case 13:
        finalHour = 1
        break
      case 14:
        finalHour = 2
        break
      case 15:
        finalHour = 3
        break
      case 16: 
        finalHour = 4
        break
      case 17:
        finalHour = 5
        break
      case 18:
        finalHour = 6
        break
      case 19:
        finalHour = 7
        break
      case 20:
        finalHour = 8
        break
      case 21:
        finalHour = 9
        break
      case 22:
        finalHour = 10
        break
      case 23:
        finalHour = 11
        break
      case 24:
        finalHour = 0
        break
      case 0:
        finalHour = 0
        break
      default:
        finalHour = finalHour
    }

    return {dueDate, date, finalHour, minute, hour}
  }

  const handleRightClick = () => { 
    taskSettingsPanelActive.set(true)
    boardSettingsPanelActive.set(false)
    newBoardName.set('')
    modalChosenColor.set('primary')
    selectedBoard.set(models.board)
    selectedTask.set(task)
    newTaskName.set(task.name)
    newTaskDueDateTime.set(task.dueDateTime)
    newTaskLevel.set(task.level)
    newTaskStatus.set(task.status)
  }

  const touchStart = () => {

  }

  const touchEnd = () => {

  }

</script>


<a
  data-sveltekit-preload-data="hover"
  data-sveltekit-preload-code='eager'
  on:click={() => loadingScreen.set(true)}
  style="text-decoration: none;"
  href="/{data.user.email}/{data.subject.id}/{data.workspace.id}/{task.status}/{task.id}">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    on:touchstart={touchStart}
    on:touchend={touchEnd}
    on:contextmenu|preventDefault={handleRightClick}
    style='overflow-x: hidden;'
    class="{determineBG(task).backgroundColor}-dark mb-1 has-transition is-clickable maxmins-w-230 maxmins-h-60 rounded parent"
  >
    <Card outlined shaped flat class='{determineBG(task).backgroundColor} p-1 maxmins-h-60 is-flex is-flex-direction-column is-justify-content-space-between'>
      <!-- Task Name and Task Labels: level and how many subtasks it has -->
      <div class="is-flex is-justify-content-space-between maxmins-w-100p">
        <div style='overflow-x: hidden;' class="{determineBG(task).textColor} has-transition fredoka-reg is-unselectable txt-size-14 maxmins-w-70p txt-overflow-ellipsis">
          {task.name}
        </div>
    
        <!-- Subtask count and level -->
        <div class="is-flex is-align-items-center is-justify-content-flex-end">
          <!-- Subtasks Counts -->
          {#if task.subtasks.length != 0}
            <Avatar tile class="mr-1 maxmins-h-20 maxmins-w-{task.subtasks.length < 100 ? "20" : "30"} is-unselectable fredoka-reg has-text-weight-bold has-text-white has-background-primary-dark rounded txt-size-9">
              {task.subtasks.length}
            </Avatar>
          {/if}
    
          <!-- Level -->
          <Avatar tile style="max-width: fit-content" class="is-unselectable maxmins-h-20 fredoka-reg has-text-white {task.level == 1?`has-background-success${determineBG(task).backgroundColor === 'has-background-success' ? '-dark' : ''}`: task.level == 2?`has-background-warning${determineBG(task).backgroundColor === 'has-background-warning' ? '-dark has-text-white' : ' has-text-black'}` : `has-background-danger${determineBG(task).backgroundColor === 'has-background-danger' ? '-dark has-text-white' : ''}`} rounded txt-size-9 px-1">
            {task.level == 1? "Low": task.level == 2? "Medium": "High"}
          </Avatar>
        </div>
      </div>
  
      <!-- Due date -->
      <div class="is-flex is-justify-content-space-between is-align-items-end">
        <div class="{determineBG(task).textColor} is-unselectable txt-size-10 fredoka-reg has-transition">
          {`${due(task).dueDate} ${due(task).date} ${due(task).finalHour}:${due(task).minute} ${parseInt(due(task).hour) > 11 ? 'PM': 'AM'}`}
        </div>
    
        <!-- Members part -->
        <div on:mouseenter={()=>show = true} on:mouseleave={()=>show = false}>
          {#if task.members.length > 3}
            <Tooltip class='px-1 py-1' bottom bind:active={show}>
              <div class="is-flex">
                <!-- 3 most members -->
                {#each Array(4) as _, i}
                  {#if i == 4}
                    <!-- Icon of how many members are there other than 3 most members -->
                    <Avatar size='17px' class='has-background-{i == 0 ? 'primary': i == 1 ? 'link' : 'info'} is-flex is-justify-content-center is-align-items-center'>
                      <div class="has-text-white has-text-weight-semibold txt-size-7 fredoka-reg is-flex is-justify-content-center is-align-items-center">
                        +{data.taskMembers.filter(tm => tm.taskID === task.id)[0].members.length - 3}
                      </div>
                    </Avatar>
                  {:else}
                    <Avatar size='17px' class='has-background-{i == 0 ? 'primary': i == 1 ? 'link' : 'info'} is-flex is-justify-content-center is-align-items-center'>
                      {#if data.taskMembers.filter(tm => tm.taskID === task.id)[0].members[i].profile === ''}
                        <div class="has-text-white has-text-weight-semibold txt-size-7 fredoka-reg is-flex is-justify-content-center is-align-items-center">
                          {`${data.taskMembers.filter(tm => tm.taskID === task.id)[0].members[i].firstName} ${data.taskMembers.filter(tm => tm.taskID === task.id)[0].members[i].lastName}`.toUpperCase().split(' ')[0].charAt(0)}{data.taskMembers.filter(tm => tm.taskID === task.id)[0].members[i].name.toUpperCase().split(' ')[data.taskMembers.filter(tm => tm.taskID === task.id)[0].members[i].name.toUpperCase().split(' ').length - 1].charAt(0)}
                        </div>
                      {:else}
                        <img src="{data.taskMembers.filter(tm => tm.taskID === task.id)[0].members[i].members[i].profile}" alt="{data.taskMembers.filter(tm => tm.taskID === task.id)[0].members[i].members[i].firstName}"/>
                      {/if}
                    </Avatar>
                  {/if}
                {/each}
              </div>
              <span slot="tip">
                <p class="has-text-left mb-0">
                  Assigned Members:
                  <Divider class="p-0 mt-1 mb-2" />
                  {#each data.taskMembers.filter(tm => tm.taskID === task.id)[0].members as member}
                    {`${member.firstName} ${member.lastName}`}<br>
                  {/each}
                </p>
              </span>
            </Tooltip>
          {:else}
            <!-- 3 or less members -->
            <div on:mouseenter={()=>show = true} on:mouseleave={()=>show = false}>
              <Tooltip class='px-1 py-1' bottom bind:active={show}>
                <div class="is-flex">
                  {#each data.taskMembers.filter(tm => tm.taskID === task.id)[0].members as member, i}
                    <Avatar size='17px' class='has-background-{member.profile === '' ? 'primary' : 'white-bis'} is-flex is-justify-content-center is-align-items-center'>
                      {#if member.profile === ''}
                        <div class="has-text-white has-text-weight-semibold txt-size-7 fredoka-reg is-flex is-justify-content-center is-align-items-center">
                          {`${member.firstName} ${member.lastName}`.toUpperCase().split(' ')[0].charAt(0)}{`${member.firstName} ${member.lastName}`.toUpperCase().split(' ')[`${member.firstName} ${member.lastName}`.toUpperCase().split(' ').length - 1].charAt(0)}
                        </div>
                      {:else}
                        <img src="{member.profile}" alt="{member.firstName} {member.lastName}"/>
                      {/if}
                    </Avatar>
                  {/each}
                </div>
                <span slot="tip">
                  <div class="has-text-left p-0">
                    Assigned Members:
                    <Divider class="p-0 mt-1 mb-2" />
                    {#each data.taskMembers.filter(tm => tm.taskID === task.id)[0].members as member}
                      {`${member.firstName} ${member.lastName}`} <br>
                    {/each}
                  </div>
                </span>
              </Tooltip>
            </div>
          {/if}
        </div>
      </div>
    </Card>
  </div>
</a>