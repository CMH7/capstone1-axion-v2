<script>
  //@ts-nocheck
	import { newTaskDueDateTime, newTaskLevel, newTaskName, newTaskStatus, statuses } from '$lib/stores/task.store';
  import { Card, Avatar } from 'svelte-materialify'
  import { fade } from 'svelte/transition'

  /**
   * @return {{backgroundColor: string, textColor: string}}
   * */
  $: determineBG = () => {
    let backgroundColor = 'has-background-success'
    let textColor = 'has-text-success-light'

    if($newTaskStatus === $statuses.filter(status => status.name === 'Done')[0].value) {
      backgroundColor = 'has-background-success'
    }else {
      let date1 = $newTaskDueDateTime
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
   * @return {{dueDate: string, date: string, finalHour: number, minute: string, hour: string}} dueObject
   * */
  $: due = () => {
    const [ dateValue, timeValue ] = $newTaskDueDateTime.toISOString().split('T')
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
</script>

<div in:fade out:fade style='overflow-x: hidden;' class="{determineBG().backgroundColor}-dark mb-1 has-transition is-clickable maxmins-w-230 maxmins-h-60 rounded parent">
  <Card outlined shaped flat class='{determineBG().backgroundColor} p-1 maxmins-h-60 is-flex is-flex-direction-column is-justify-content-space-between'>
    <!-- Task Name and Task Labels: level and how many subtasks it has -->
    <div class="is-flex is-justify-content-space-between maxmins-w-100p">
      <div style='overflow-x: hidden;' class="{determineBG().textColor} has-transition fredoka-reg is-unselectable txt-size-14 maxmins-w-70p txt-overflow-ellipsis">
        {$newTaskName}
      </div>
  
      <!-- Subtask count and level -->
      <div class="is-flex is-align-items-center">
        <!-- Subtasks Counts -->
        <Avatar tile class="mr-1 maxmins-h-20 maxmins-w-20 is-unselectable fredoka-reg has-text-weight-bold has-text-white has-background-primary-dark rounded txt-size-9">
          0
        </Avatar>
  
        <!-- Level -->
        <Avatar tile style="max-width: fit-content" class="is-unselectable maxmins-h-20 fredoka-reg has-text-white {$newTaskLevel == 1?"has-background-success": $newTaskLevel == 2?"has-background-warning has-text-black":"has-background-danger"} rounded txt-size-9 px-1">
          {$newTaskLevel == 1? "Low": $newTaskLevel == 2? "Medium": "High"}
        </Avatar>
      </div>
    </div>

    <!-- Due date -->
    <div class="is-flex is-align-items-end">
      <div class="{determineBG().textColor} is-unselectable txt-size-10 fredoka-reg has-transition">
        {`${due().dueDate} ${due().date} ${due().finalHour}:${due().minute} ${parseInt(due().hour) > 11 ? 'PM': 'AM'}`}
      </div>
    </div>
  </Card>
</div>