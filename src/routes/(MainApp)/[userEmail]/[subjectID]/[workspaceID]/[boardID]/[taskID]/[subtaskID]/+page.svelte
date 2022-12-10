<script>
  //@ts-nocheck
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
  import { activeBoard } from '$lib/stores/boards.store';
	import { activeSubject, activeWorkspace } from '$lib/stores/dashboard.store';
	import { breadCrumbsItems, currentIndex, hintText, loadingScreen, navDrawerActive, notifCenterOpen, notifs } from '$lib/stores/global.store';
	import { activeTask, taskSettingsPanelActive } from '$lib/stores/task.store';
	import { mdiAccountOutline,mdiAccountPlusOutline, mdiBellCancelOutline, mdiBellCheckOutline, mdiCancel, mdiChat,mdiCheck,mdiChevronDown,mdiChevronUp,mdiClose,mdiCogOutline,mdiEyeOutline,mdiFileUpload, mdiLeadPencil,mdiMagnify,mdiPencil,mdiPlus,mdiSend,mdiSourceBranch,mdiStar, mdiStarOutline, mdiText, mdiTrashCan } from '@mdi/js';
	import { onMount } from 'svelte';
  import { Icon, Avatar, MaterialApp, Tabs, Tab, Divider, Checkbox, Window, WindowItem, Textarea, Button, ClickOutside, TextField, Badge, Select } from 'svelte-materialify'
  import SveltyPicker from 'svelty-picker'
  import { Moon } from 'svelte-loading-spinners'
	import { workspaceSettingsPanelActive } from '$lib/stores/workspace.store';
	import { newSubtaskDescription, newSubtaskDue, newSubtaskLevel, newSubtaskName, newSubtaskStatus } from '$lib/stores/subtask.store';


  /** 
   * @type {import('./$types').PageServerData}
   * */
  export let data

  /**
   * @type {{name: string, id: string, color: string}[]}
   */
  let statuses = []
  /**
   * @type {string[]}
   * */
  let group = []
  let levels = [
    {name: 'Low', color: 'success', value: 1},
    {name: 'Medium', color: 'warning', value: 2},
    {name: 'High', color: 'danger', value: 3},
  ]
  let innerWidth = 0
  let currentWindow = 0
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
  let renaming = false
  let changingLevel = false
  let changingFav = false
  let newDue = ''
  let changingDue1 = false
  let changingDue = false
  let changingStatus = false
  let changingDescription = false
  let sendingChat = false
  let sendingEditedChat = false
  let subscribing = false
  let searchingMemberInput = ''
  let addingAssignee = false
  let currentAssignee = ''
  let removingAssignee = false
  let addingSubtask = false

  
  $: newStatus = {
    id: data.board.id,
    name: data.board.name,
    color: data.board.color
  }
  $: fav = data.user.favorites[2].ids.includes(data.task.id) ? 'rem' : 'set'
  $: month = parseInt(data.task.dueDateTime.toISOString().split('T')[0].split('-')[1])
  $: hour = parseInt(data.task.dueDateTime.toISOString().split('T')[1].split('-')[0])
  $: innerWidth > 769 ? showOptions = false : null
  $: oldDescriptionValue = data.task.description
  $: localWorkspaceMembers = data.workspaceMembers.filter(wm => {
    if(data.members.filter(tm => tm.id === wm.id).length == 0) {
      return wm
    }
  })
  $: subsMode = data.subscriber ? 'unsub' : 'sub'
  $: searchingMemberInput !== '' ? localWorkspaceMembers = data.workspaceMembers.filter(wm => {
    if(data.members.filter(tm => tm.id === wm.id).length == 0) {
      return wm
    }
  }).filter(member => `${member.firstName}${member.lastName} ${member.email}`.toLowerCase().match(searchingMemberInput.toLowerCase())) : localWorkspaceMembers = data.workspaceMembers.filter(wm => {
    if(data.members.filter(tm => tm.id === wm.id).length == 0) {
      return wm
    }
  })

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

  const rename = async () => {
    if(renaming) return
    if(newTaskName === '') return
    renaming = true

    let form = document.getElementById('formTaskRename')
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
    renaming = false
    taskNameEditing = false
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Task renamed successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }else{
      $notifs = [...$notifs, {
        msg: 'Task rename failed',
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  /** 
   * @param {number} i
   */
  const newLevel = async (i) => {
    if(changingLevel) return
    currentLevel = i
    changingLevel = true
    showLevels = false
    
    let form = document.getElementById('formTaskNewLevel')
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
    changingLevel = false
    currentLevel = 0
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Task level updated successfully',
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }else{
      $notifs = [...$notifs, {
        msg: 'Task level update failed',
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  const setFav = async () => {
    if(changingFav) return
    changingFav = true
    showFavorites = false

    let form = document.getElementById('formTaskSetFav')
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
    changingFav = false
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: `${fav === 'rem' ? 'Added' : 'Removed'} to favorites`,
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }else{
      $notifs = [...$notifs, {
        msg: 'Task favorite update failed',
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  const setNewDue = async () => {
    if(changingDue) return
    changingDue = true

    let form = document.getElementById('formTaskSetNewDue')
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
    changingDue = false
    changingDue1 = false
    newDue = ''
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: `Due date and time updated successfully`,
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }else{
      $notifs = [...$notifs, {
        msg: 'Task due date and time update failed',
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  const setNewStatus = async () => {
    if(changingStatus) return
    changingStatus = true
    showStatuses = false

    let form = document.getElementById('formTaskSetNewStatus')
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
    changingStatus = false
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: `Status updated successfully`,
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }else{
      $notifs = [...$notifs, {
        msg: 'Task status update failed',
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }
  
  const changeDesc = async () => {
    if(changingDescription) return
    changingDescription = true

    let form = document.getElementById('formTaskNewDesc')
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
    changingDescription = false
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: `Description updated successfully`,
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }else{
      $notifs = [...$notifs, {
        msg: 'Task description update failed',
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  const sendChat = async () => {
    if(sendingChat) return
    if(chatInput === '') return
    sendingChat = true

    let form = document.getElementById('formTaskSendChat')
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
    sendingChat = false
    chatInput = ''
  }

  const sendEditedChat = async () => {
    if(sendingEditedChat) return
    if(editedChatText === '') return
    sendingEditedChat = true

    let form = document.getElementById('formTaskEditChat')
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
    sendingEditedChat = false
    chatEditing = false
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Chat edited successfully',
        type: `success`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  const subscribe = async () => {
    if(subscribing) return
    subscribing = true

    let form = document.getElementById('formTaskSubscribe')
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
    subscribing = false
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: `${subsMode === 'unsub' ? 'Subscribed' : 'Unsubscribed'} successfully`,
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }else{
      $notifs = [...$notifs, {
        msg: 'Task subscribing failed',
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  const addAssignee = async () => {
    if(addingAssignee) return
    addingAssignee = true

    let form = document.getElementById('formTaskAddAssignee')
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
    addingAssignee = false
    currentAssignee = ''
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: `Assigned successfully`,
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }else{
      $notifs = [...$notifs, {
        msg: 'Task assigning failed',
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  const remAssignee = async () => {
    if(removingAssignee) return
    removingAssignee = true

    let form = document.getElementById('formTaskRemAssignee')
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
    removingAssignee = false
    currentAssignee = ''
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: `Removed assignee successfully`,
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }else{
      $notifs = [...$notifs, {
        msg: 'Task remove assignment failed',
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  const addSubtask = async () => {
    if(addingSubtask) return
    if($newSubtaskName === '') return
    if($newSubtaskDue === '') return 
    addingSubtask = true

    let form = document.getElementById('formTaskAddSubtask')
    const data1 = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data1
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
    addingSubtask = false
    newSubtaskName.set('')
    newSubtaskDescription.set('')
    newSubtaskLevel.set(1)
    newSubtaskStatus.set(data.statuses.filter(b => b.name.toLowerCase() === 'todo')[0].id)
    newSubtaskDue.set('')
    group = []
    addSubtaskPanelOpen = false
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: `Subtask created`,
        type: 'success',
        id: `${(Math.random() * 999) + 1}`
      }]
    }else{
      $notifs = [...$notifs, {
        msg: 'Subtask creation failed',
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }
  }

  const keyDown = e => {
    if(e.keyCode == 13 && taskNameEditing) {
      rename()
    } else if(e.keyCode == 13 && chatInput !== '' && !chatEditing) {
      sendChat()
    } else if(e.keyCode == 13 && chatEditing) {
      sendEditedChat()
    }
  }

  onMount(() => {
    currentIndex.set(0)
    activeSubject.set(data.subject)
    activeWorkspace.set(data.workspace)
    activeBoard.set(data.board)
    activeTask.set(data.task)
    $breadCrumbsItems = [
      {text: data.subject.name, href: `/${data.user.email}`},
      {text: data.workspace.name, href: `/${data.user.email}/${data.subject.id}`},
      {text: data.board.name, href: `/${data.user.email}/${data.subject.id}/${data.workspace.id}`},
      {text: data.parentTask.name, href: `/${data.user.email}/${data.subject.id}/${data.workspace.id}/${data.parentTask.status}/${data.parentTask.id}`},
      {text: data.task.name, href: `/${data.user.email}/${data.subject.id}/${data.workspace.id}/${data.parentTask.status}${data.parentTask.id}`},
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
    workspaceSettingsPanelActive.set(false)
    taskSettingsPanelActive.set(false)
    newSubtaskStatus.set(data.statuses.filter(b => b.name.toLowerCase() === 'todo')[0].id)
    loadingScreen.set(false)
  })
</script>

<svelte:window bind:innerWidth on:keydown={keyDown} />

<svelte:head>
  <title>{$activeTask.name}</title>
</svelte:head>

<!-- FORMS -->
<div class="is-hidden">
  <!-- task rename form -->
  <form action="?/taskRename" id='formTaskRename' class="is-hidden" use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="text" name='name' bind:value={newTaskName}>
  </form>

  <!-- task level form -->
  <form action="?/taskNewLevel" id='formTaskNewLevel' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="number" name='level' bind:value={currentLevel}>
  </form>

  <!-- task fav form -->
  <form action="?/taskSetFav" id='formTaskSetFav' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="text" name='setFav' bind:value={fav}>
  </form>

  <!-- task due form -->
  <form action="?/taskSetNewDue" id='formTaskSetNewDue' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="text" name='newDue' bind:value={newDue}>
  </form>

  <!-- task status form -->
  <form action="?/taskSetNewStatus" id='formTaskSetNewStatus' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="text" name='oldStatus' bind:value={data.board.id}>
    <input type="text" name='status' bind:value={currentAstatus}>
  </form>
  
  <!-- task description form -->
  <form action="?/taskSetDesc" id='formTaskNewDesc' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="text" name='desc' bind:value={description}>
  </form>

  <!-- task chats form -->
  <form action="?/taskSendChat" id='formTaskSendChat' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="text" name='message' bind:value={chatInput}>
  </form>
  
  <!-- task edit chats form -->
  <form action="?/taskEditChat" id='formTaskEditChat' class='is-hidden' use:enhance>
    <input type="text" name='message' bind:value={editedChatText}>
    <input type="text" name='chatID' bind:value={currentChat}>
  </form>

  <!-- task subscribe form -->
  <form action="?/taskSubscribe" id='formTaskSubscribe' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="text" name='subscribe' bind:value={subsMode}>
  </form>

  <!-- task add assignee form -->
  <form action="?/taskAddAssignee" id='formTaskAddAssignee' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="text" name='memberID' bind:value={currentAssignee}>
  </form>
  
  <!-- task remove assignee form -->
  <form action="?/taskRemAssignee" id='formTaskRemAssignee' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="text" name='memberID' bind:value={currentAssignee}>
  </form>
  
  <!-- task add subtask form -->
  <form action="?/taskAddSubtask" id='formTaskAddSubtask' class='is-hidden' use:enhance>
    <input type="text" name='id' bind:value={data.task.id}>
    <input type="text" name='name' bind:value={$newSubtaskName}>
    <input type="text" name='description' bind:value={$newSubtaskDescription}>
    <input type="text" name='level' bind:value={$newSubtaskLevel}>
    <input type="text" name='status' bind:value={$newSubtaskStatus}>
    <input type="text" name='status' bind:value={$newSubtaskStatus}>
    <input type="text" name='due' bind:value={$newSubtaskDue}>
    <input type="text" name='assignees' bind:value={group}>
  </form>
</div>

<div>
  <div class="columns is-mobile is-multiline is-relative">
    <!-- right side -->
    <div style="transform-origin: top center; border-top: 1px solid rgba(0, 0, 0, 0.3)" class='has-background-white column is-8-desktop is-6-tablet is-12-mobile has-transition {innerWidth > 768 ? '' : $navDrawerActive || $notifCenterOpen ? '' : 'z-2'} {showOptions ? 'rot-x-90 pos-abs' : 'rot-x-0'}'>
  
      <!-- name, level, favorite, subtasks count, options -->
      <div class="columns is-mobile is-multiline">
        <!-- name -->
        <div style='{innerWidth < 769 ? 'border-bottom: 1px solid rgba(0, 0, 0, 0.3); margin-bottom: 3%' : ''}' class="column is-12-mobile is-flex is-justify-content-space-between is-align-items-center">

          <div on:mouseenter={() => hintText.set('Hint text here')} class="fredoka-reg txt-size-{innerWidth < 571 ? '25' : '40'} has-text-grey-dark is-flex is-align-items-center txt-overflow-ellipsis overflow-x-hidden {taskNameEditing ? 'is-hidden' : ''}">
            {data.task.name}
          </div>

          <input disabled={renaming} bind:value={newTaskName} style='border: 1px solid rgba(0, 0, 0, 0.3); overflow-x: hidden;' type="text" class="{taskNameEditing ? '' : 'is-hidden'} fredoka-reg txt-size-{innerWidth < 571 ? '25' : '40'} flex-grow-1 rounded has-text-grey-dark is-flex is-align-items-center txt-overflow-ellipsis">

          <div class='{taskNameEditing ? 'is-hidden' : ''}'>
            <Button
              on:click={() => taskNameEditing = true}
              icon
            >
              <Icon size='{innerWidth < 571 ? '15px' : '20px'}' path={mdiPencil} />
            </Button>
          </div>

          <div class="is-flex is-flex-direction-column {taskNameEditing ? '' : 'is-hidden'}">
            <div class='{newTaskName !== data.task.name && !renaming ? '' : 'is-hidden'}'>
              <Button
                icon
                on:click={rename}
              >
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
                class='{!renaming ? '' : 'is-hidden'}'
              >
                <Icon size='{innerWidth < 571 ? '15px' : '20px'}' class='has-text-danger' path={mdiCancel} />
              </Button>
            </div>

            <div class="{renaming ? '' : 'is-hidden'} mx-3">
              <Moon size={30} color='#000' />
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
            on:click={() => {
              if(changingLevel) return
              showLevels = !showLevels
            }}
            class="tags has-addons is-hidden-mobile m-0 is-clickable"
          >
            <div class="tag m-0 is-{data.task.level == 3 ? 'danger' : data.task.level == 2 ? 'warning' : 'success'}">
              Priority
            </div>
            <div class="tag m-0 is-{data.task.level == 3 ? 'danger' : data.task.level == 2 ? 'warning' : 'success'} is-light is-relative">
              {data.task.level == 3 ? 'High' : data.task.level == 2 ? 'Medium' : 'Low'}

              {#if !changingLevel}
                <Icon style='transform: rotateZ({showLevels ? '180' : '0'}deg)' path={mdiChevronDown} />
              {:else}
                <div class='ml-3'>
                  <Moon size={20} color='#000' />
                </div>
              {/if}

              <div
                style='transform-origin: top center;'
                class="maxmins-w-100p min-h-100p pos-abs pos-r-0 pos-t-100p has-background-white elevation-3 has-transition {$navDrawerActive ? '' : 'z-10'} {showLevels ? 'rot-x-0' : 'rot-x-90'} ">
                {#each levels as level}
                  {#if data.task.level != level.value}
                    <div
                      on:mouseenter={() => levelHovering(level.value, true)}
                      on:mouseleave={() => levelHovering(level.value, false)}
                      on:touchstart={() => levelHovering(level.value, true)}
                      on:touchend={() => levelHovering(level.value, false)}
                      on:click={() => newLevel(level.value)}
                      class='p-3 has-background-{level.color}-{levelHoverings && currentLevel == level.value ? 'light' : ''} has-text-grey-dark fredoka-reg'>
                      {level.name}
                    </div>
                  {/if}
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
            on:click={() => {
              if(changingLevel) return
              showLevels = !showLevels
            }}
            class="is-hidden-tablet is-clickable tag is-{data.task.level == 3 ? 'danger' : data.task.level == 2 ? 'warning' : 'success'} is-relative"
          >
            {#if !changingLevel}
              {data.task.level == 3 ? 'High' : data.task.level == 2 ? 'Medium' : 'Low'}
            {:else}
              <Moon size={20} color='#000' />
            {/if}
            <div
              style='transform-origin: top center'
              class="maxmins-w-100 min-h-100p pos-abs pos-l-0 pos-t-100p has-transition has-background-white elevation-3 {$navDrawerActive ? '' : 'z-10'} {showLevels ? 'rot-x-0' : 'rot-x-90'}">
              {#each levels as level}
                {#if data.task.level != level.value}
                  <div
                    on:mouseenter={() => levelHovering(level.value, true)}
                    on:mouseleave={() => levelHovering(level.value, false)}
                    on:touchstart={() => levelHovering(level.value, true)}
                    on:touchend={() => levelHovering(level.value, false)}
                    on:click={() => newLevel(level.value)}
                    class='p-3 has-background-{level.color}-{levelHoverings && currentLevel == level.value ? 'light' : ''}  has-text-grey-dark fredoka-reg'>
                    {level.name}
                  </div>
                {/if}
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
            on:click={() => {
              if(changingFav) return
              showFavorites = !showFavorites
            }}
            class="tags m-0 has-addons is-hidden-mobile is-clickable"
          >
            <div class="tag m-0 is-warning is-unselectable">
              Favorite
            </div>
            <div class="tag m-0 is-warning is-light is-relative">
              {#if data.user.favorites[2].ids.includes(data.task.id)}
                True
              {:else}
                False
              {/if}
              
              {#if !changingFav}
                <Icon style='transform: rotateZ({showFavorites ? '180' : '0'}deg)' path={mdiChevronDown} />
              {:else}
                <div class="ml-3">
                  <Moon size={20} color='#000' />
                </div>
              {/if}

              <div
                style='transform-origin: top center;'
                class="maxmins-w-100p min-h-100p pos-abs pos-r-0 pos-t-100p has-background-white elevation-3 has-transition {$navDrawerActive ? '' : 'z-10'} {showFavorites ? 'rot-x-0' : 'rot-x-90'}"
              >
                <div
                  on:mouseenter={() => favHovering(1, true)}
                  on:mouseleave={() => favHovering(1, false)}
                  on:touchstart={() => favHovering(1, true)}
                  on:touchend={() => favHovering(1, false)}
                  on:click={setFav}
                  class='p-3 has-background-{data.user.favorites[2].ids.includes(data.task.id) ? 'danger' : 'success'}-{favHoverings && currentFav == 1 ? 'light' : ''} has-text-grey-dark fredoka-reg'
                >
                    {#if !data.user.favorites[2].ids.includes(data.task.id)}
                      True
                    {:else}
                      False
                    {/if}
                </div>
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
            on:click={() => {
              if(changingFav) return
              showFavorites = !showFavorites
            }}
            class="is-hidden-tablet tag is-light is-relative is-clickable"
          >
            {#if !changingFav}
              {#if data.user.favorites[2].ids.includes(data.task.id)}
                <Icon class='has-text-warning' path={mdiStar} />
              {:else}
                <Icon class='has-text-warning' path={mdiStarOutline} />
              {/if}
            {:else}
              <Moon size={20} color='#000' />
            {/if}

            <div
              style='transform-origin: top center;'
              class="min-w-fit-content min-h-100p pos-abs pos-l-0 pos-t-100p has-background-white elevation-3 has-transition {$navDrawerActive ? '' : 'z-10'} {showFavorites ? 'rot-x-0' : 'rot-x-90'} ">
              <div
                on:mouseenter={() => favHovering(1, true)}
                on:mouseleave={() => favHovering(1, false)}
                on:touchstart={() => favHovering(1, true)}
                on:touchend={() => favHovering(1, false)}
                on:click={setFav}
                class='p-3 has-background-{data.user.favorites[2].ids.includes(data.task.id) ? 'danger' : 'success'}-{favHoverings && currentFav == 1 ? 'light' : ''} has-text-grey-dark fredoka-reg is-clickable'>
                {#if !data.user.favorites[2].ids.includes(data.task.id)}
                  True
                {:else}
                  False
                {/if}
              </div>
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
          <div style='border-right: 1px solid rgba(0, 0, 0, 0.3)' class='is-flex is-align-items-center'>
            <div class="fredoka-reg has-text-grey">
              Due:
            </div>

            <div>
              <SveltyPicker
                  placeholder="{`${month == 1 ? 'Jan' : month == 2 ? 'Feb' : month == 3 ? 'Mar' : month == 4 ? 'Apr' : month == 5 ? 'May' : month == 6 ? 'Jun' : month == 7 ? 'Jul' : month == 8 ? 'Aug' : month == 9 ? 'Sep' : month == 10 ? 'Oct' : month == 11 ? 'Nov' : month == 12 ? 'Dec' : ''} ${data.task.dueDateTime.toISOString().split('T')[0].split('-')[2]}, ${data.task.dueDateTime.toISOString().split('T')[0].split('-')[0]} ${hour == 13 ? '01' : hour == 14 ? '02' : hour == 15 ? '03' : hour == 16 ? '04' : hour == 17 ? '05' : hour == 18 ? '06' : hour == 19 ? '07' : hour == 20 ? '08' : hour == 21 ? '09' : hour == 22 ? '10' : hour == 23 ? '11' : hour == 24 || hour == 0 ? '12' : hour}:${$activeTask.dueDateTime.toISOString().split('T')[1].split(':')[1]} ${parseInt(data.task.dueDateTime.toISOString().split('T')[1].split('-')[0]) > 11 ? 'PM': 'AM'}`}"
    
                  inputClasses="maxmins-w-100p rounded p-2 fredoka-reg is-clickable {innerWidth < 571 ? 'txt-size-12' : '20 pr-3'} has-text-grey-dark "
                  format="yyyy-mm-dd hh:ii"
                  bind:value={newDue}
                  clearBtn={false}
                  todayBtn={false}
                  required={true}
                  on:mousedown={() => changingDue1 = true}
              />
            </div>

            {#if changingDue1}
              {#if !changingDue}
                <div class="ml-3 is-flex is-flex-direction-column is-align-items-center is-justify-content-center">
                  <Button
                    size='small'
                    icon
                    class='green-text'
                    on:click={setNewDue}
                  >
                    <Icon path={mdiCheck} />
                  </Button>
                  <Button
                    size='small'
                    icon
                    class='red-text'
                    on:click={() => {
                      changingDue1 = false
                      newDue = ''
                    }}
                  >
                    <Icon path={mdiCancel} />
                  </Button>
                </div>
              {:else}
                <Moon size={20} color='#000' />
              {/if}
            {/if}
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
                    <Icon class='blue-text' path={mdiAccountOutline} />
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
                    class='{changingDescription ? 'is-hidden' : ''}'
                  >
                    Cancel
                  </Button>
                  <Button 
                    depressed
                    size='small'
                    class='mx-3 has-background-success has-text-white'
                    on:click={changeDesc}
                  >
                    {#if !changingDescription}
                      Save
                    {:else}
                      <Moon size={20} color='#000' />
                    {/if}
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
                            <Avatar style='border: 1px solid rgba(0, 0, 0, 0.3)' size='{innerWidth < 571 ? '30px' : '50px'}' class='has-background-white'>
                              {#if data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.profile !== ''}
                                <img src="{data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.profile}" alt="{data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.firstName}">
                              {:else}
                                <Icon class='{data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.gender === 'Male' ? 'blue' : 'pink'}-text' path={mdiAccountOutline} />
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
                            disabled={sendingEditedChat}
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
                      <div class='maxmins-w-20 {chatHoverings && currentChat === chat.id && data.chatChatSenders.filter(ccs => ccs.chatID === chat.id)[0].chatSender.id === data.user.id ? '' : 'is-hidden'}'>
                        {#if chatEditing && currentChat === chat.id}
                          {#if !sendingEditedChat}
                            <Button
                              size='small'
                              icon
                              disabled={sendingEditedChat}
                              on:click={sendEditedChat}
                            >
                              <Icon size='15px' class='green-text' path={mdiCheck} />
                            </Button>
                            <Button
                              size='small'
                              icon
                              disabled={sendingEditedChat}
                              on:click={() => chatEdit(chat.id, false)}
                            >
                              <Icon size='15px' class='has-text-danger' path={mdiCancel} />
                            </Button>
                          {:else}
                            <Moon size={20} color='#000' />
                          {/if}
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
                  <input disabled={sendingChat} bind:value={chatInput} name='chatTextField' type="text" placeholder="Type a message" style='border: 1px solid rgba(0, 0, 0, 0.3)' class='flex-grow-1 px-2 py-1 rounded {innerWidth < 571 ? 'txt-size-13' : ''}'>

                  <div class='maxmins-w-50 centerxy'>
                    <Button
                      size='small'
                      icon
                      disabled={sendingChat}
                      on:click={sendChat}
                    >
                      {#if !sendingChat}
                        <Icon class='has-text-info' path={mdiSend} />
                      {:else}
                        <Moon size={20} color='#000' />
                      {/if}
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

                    {#if innerWidth > 570}
                      <div class='fredoka-reg has-text-white'>
                        Description
                      </div>
                    {/if}
                    
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
                    <a href="/{data.user.email}/{data.subject.id}/{data.workspace.id}/{subtask.status}/{data.task.id}/{subtask.id}">
                      <div
                        on:mouseenter={() => subtaskHovering(subtask.id, true)}
                        on:mouseleave={() => subtaskHovering(subtask.id, false)}
                        style='border-bottom: 1px solid rgba(0, 0, 0, 0.3)' class='maxmins-w-100p is-flex is-align-items-center has-transition px-2 py-{innerWidth < 571 ? '1' : '2'} {subtaskHoverings && currentSubtask === subtask.id ? 'has-background-grey-lighter' : 'has-background-white'}'
                      >
                        <!-- subtask name -->
                        <div style='overflow-x: hidden' class="fredoka-reg has-text-grey-dark min-w-40p max-w-75p txt-overflow-ellipsis {innerWidth < 571 ? 'txt-size-13' : ''}">
                          {subtask.name}
                        </div>
  
                        {#if innerWidth > 570}
                          <div style='overflow-x: hidden' class='max-w-40p fredoka-reg has-text-grey-dark flex-grow-1 txt-overflow-ellipsis'>
                            {subtask.description}
                          </div>
                        {/if}
  
                        <div class='is-flex is-justify-content-flex-end is-align-items-center flex-grow-1'>
                          <div class="tags mb-0 has-addons">
                            <!-- level -->
                            <div class='tag mb-0 fredoka-reg is-{subtask.level == 1 ? 'success' : subtask.level == 2 ? 'warning' : 'danger'}'>
                              {subtask.level == 1 ? 'L' : subtask.level == 2 ? 'M' : 'H'}
                            </div>
    
                            <div class='tag mb-0 fredoka-reg is-{data.statuses.filter(status => status.id === subtask.status)[0].color}'>
                              {data.statuses.filter(status => status.id === subtask.status)[0].name}
                            </div>
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
  
      <!-- status and viewers and subscribe -->
      <div class="columns is-mobile is-multiline">
        <!-- status -->
        <div class="column is-12-touch {innerWidth < 769 ? 'pr-0' : ''}">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            use:ClickOutside
            on:clickOutside={() => showStatuses = false}
            on:click={() => {
              if(changingStatus) return
              showStatuses = !showStatuses
            }}
            class='mt-4 tags has-addons is-clickable'
          >
            <div class='tag {innerWidth < 769 ? 'px-1' : ''} mb-0 is-{data.board.color} fredoka-reg'>
              Status
            </div>
            <div class="flex-grow-1 tag {innerWidth < 769 ? 'pr-0' : ''} mb-0 is-{newStatus.color} is-light is-relative">
              <div class="maxmins-w-100p is-clickable is-flex is-align-items-center is-justify-content-space-between">
                <div class="fredoka-reg">
                  {newStatus.name}
                </div>
  
                <div>
                  {#if !changingStatus}
                    <Icon style='transform: rotateZ({showStatuses ? '180' : '0'}deg)' path={mdiChevronDown} />
                  {:else}
                    <div class='ml-3'>
                      <Moon size={20} color='#000' />
                    </div>
                  {/if}
                </div>
  
              </div>
              <div style="transform-origin: top center;" class="{$navDrawerActive ? '' : 'z-2'} pos-abs pos-l-0 pos-t-100p has-background-white elevation-3 maxmins-w-100p has-transition {showStatuses ? 'rot-x-0' : 'rot-x-90'}">
                {#each statuses as Astatus}
                 {#if Astatus.id !== newStatus.id}
                    <div
                      on:mouseenter={() => hovering(Astatus, true)}
                      on:touchstart={() => hovering(Astatus, true)}
                      on:mouseleave={() => hovering(Astatus, false)}
                      on:touchend={() => hovering(Astatus, false)}
                      on:click={setNewStatus}
                      class='maxmins-w-100p p-3 has-text-grey-dark {hoverings && currentAstatus === Astatus.id ? `has-background-${Astatus.color}-light has-background-${Astatus.color}-lighter` : ''} fredoka-reg is-clickable'
                    >
                      {Astatus.name}
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          </div>
        </div>
        
        <!-- viewers -->
        <div class="column is-narrow-desktop is-6-touch {innerWidth < 769 ? 'pr-0' : ''}">
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
                      <Avatar size='20'>
                        {#if viewer.profile !== ''}
                          <img src="{viewer.profile}" alt="{viewer.firstName} {viewer.lastName}">
                        {:else}
                          <Icon class='blue-text' path={mdiAccountOutline} />
                        {/if}
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

        <!-- subscribe -->
        <div class='column is-6-touch'>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div 
            class='tags has-addons mt-4 mb-0 is-clickable'
            on:click={subscribe}
          >
            <div class='tag is-dark mb-0'>
              {#if data.subscriber}
                <Icon class='white-text' path={mdiBellCancelOutline} />
              {:else}
                <Icon class='white-text' path={mdiBellCheckOutline} />
              {/if}
            </div>
            <div class='tag is-light mb-0 fredoka-reg'>
              {#if !subscribing}
                {#if !data.subscriber}
                  Subscribe
                {:else}
                  Unsubscribe
                {/if}
              {:else}
                <Moon size={20} color='#000' />
              {/if}
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
        class="is-flex is-flex-direction-column p-2 maxmins-w-100p maxmins-h-48v">
        <!-- loop here -->
        {#each data.members as member}  
          <div
            class="maxmins-w-100p my-2"
            on:mouseenter={() => {
              if(removingAssignee) return
              currentAssignee = member.id
            }}
          >
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
                <Button
                  icon
                  disabled={removingAssignee}
                  on:click={remAssignee}
                >
                  {#if removingAssignee && currentAssignee === member.id}
                    <Moon size={20} color="#000" />
                  {:else}
                    <Icon class='red-text' path={mdiClose} />
                  {/if}
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
  <div class="has-transition z-{$notifCenterOpen || $navDrawerActive ? '1' : '2'} pos-fix p-2 pos-t-57 pos-r-0 {innerWidth < 571 ? 'min-h-fit-content' : 'maxmins-h-calc-100vh-65px'} maxmins-w-400-dt-to-mb-100p has-background-white-bis {!addPanelOpen ? innerWidth < 571 ? 'rot-x-90' : 'rot-y-90': innerWidth < 571 ? 'rot-x-0' : 'rot-y-0'} rounded-b elevation-4 is-flex is-flex-direction-column" style='transform-origin: top right'>
    <!-- title -->
    <div class='maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center'>
      <div class='fredoka-reg is-size-6'>
        Add assignee
      </div>
      
      <Button
        icon
        on:click={() => {
          if(addingAssignee) return
          addPanelOpen = false
        }}
      >
        <Icon class='has-text-danger' path={mdiClose} />
      </Button>
    </div>

    <!-- search bar -->
    <div class="maxmins-w-100p mt-3">
      <MaterialApp>
        <div class="has-background-white-bis">
          <TextField
            color='grey'
            outlined
            class='fredoka-reg'
            bind:value={searchingMemberInput}
          >
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
      {#if localWorkspaceMembers.length != 0}
        {#each localWorkspaceMembers as wm}
          <div
            on:mouseenter={() => {
              if(addingAssignee) return
              currentAssignee = wm.id
            }}
            class="maxmins-w-100p mb-3">
            <div style="overflow: hidden;" class="maxmins-w-100p has-background-white elevation-1 rounded-lg maxmins-h-65 is-flex">
              <div class="maxmins-w-20p flex-shrink-0 centerxy">
                <Badge class='success-color' dot bottom offsetX={10} offsetY={10} active={wm.online}>
                  <Avatar style='border: 1px solid rgba(0, 0, 0, 0.3);' class='has-background-white'>
                    {#if wm.profile}
                      <img src="{wm.profile}" alt="{`${wm.firstName} ${wm.lastName}`}">
                    {:else}
                      <Icon class='{wm.gender === 'Male' ? 'blue' : 'pink'}-text' path={mdiAccountOutline} />
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
                <Button
                  icon
                  size='x-small'
                  disabled={addingAssignee}
                  on:click={addAssignee}
                >
                  {#if addingAssignee && currentAssignee === wm.id}
                    <Moon size={20} color='#000' />
                  {:else}
                    <Icon size='20px' path={mdiPlus} />
                  {/if}
                </Button>
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div class='fredoka-reg has-text-grey'>
          There's no {searchingMemberInput} found
        </div>
      {/if}
    </div>
  </div>

  <!-- add Subtask panel -->
  <div class="has-transition z-{$notifCenterOpen || $navDrawerActive ? '1' : '2'} pos-fix p-2 pos-t-57 pos-r-0 maxmins-h-calc-100vh-65px maxmins-w-400-dt-to-mb-100p has-background-white-bis {!addSubtaskPanelOpen ? innerWidth < 571 ? 'rot-x-90' : 'rot-y-90': innerWidth < 571 ? 'rot-x-0' : 'rot-y-0'} rounded-b elevation-4 is-flex is-flex-direction-column" style='transform-origin: top right'>
    <!-- title -->
    <div class='maxmins-w-100p is-flex is-justify-content-space-between is-align-items-center'>
      <div class='fredoka-reg is-size-6'>
        Add subtask
      </div>
      
      <Button
        icon
        disabled={addingSubtask}
        on:click={() => {
          if(addingSubtask) return
          addSubtaskPanelOpen = false
        }}
      >
        <Icon class='has-text-danger' path={mdiClose} />
      </Button>
    </div>

    <!-- task name -->
    <div class="maxmins-w-100p mt-3">
      <MaterialApp>
        <div class="has-background-white-bis">
          <TextField
            color='grey'
            outlined
            dense
            class='fredoka-reg'
            error={$newSubtaskName === ''}
            bind:value={$newSubtaskName}
            disabled={addingSubtask}
            rules={[
              /** @param {string} v */ v => v !== '' || 'Task name cannot be empty'
            ]}
          >
            Task name
          </TextField>
        </div>
      </MaterialApp>
    </div>
    
    <!-- task description -->
    <div class="maxmins-w-100p mt-3">
      <MaterialApp>
        <div class="has-background-white-bis">
          <Textarea
            rows={2}
            outlined
            color='grey'
            disabled={addingSubtask}
            bind:value={$newSubtaskDescription}
          >
            Description
          </Textarea>
        </div>
      </MaterialApp>
    </div>
    
    <!-- task level -->
    <div class="maxmins-w-100p mt-3">
      <MaterialApp>
        <div class="has-background-white-bis">
          <Select
            dense
            outlined
            mandatory
            disabled={addingSubtask}
            items={[{name: 'Low', value: 1}, {name: 'Medum', value: 2}, {name: 'High', value: 3}]}
            bind:value={$newSubtaskLevel}
          >
            Priority
          </Select>
        </div>
      </MaterialApp>
    </div>

    <!-- task status -->
    <div class="maxmins-w-100p mt-3">
      <MaterialApp>
        <div class="has-background-white-bis">
          <Select
            disabled={addingSubtask}
            dense
            outlined
            mandatory
            items={data.statuses.map(status => {return {name: status.name, value: status.id}})}
            bind:value={$newSubtaskStatus}
          >
            Status
          </Select>
        </div>
      </MaterialApp>
    </div>

    <!-- task due -->
    <div class="maxmins-w-100p mt-3">
      <div style='border: 1px solid rgba({$newSubtaskDue === '' ? '255' : '0'}, 0, 0, {$newSubtaskDue === '' ? '1' : '0.4'}); overflow: hidden;' class='rounded'>
        <SveltyPicker
            placeholder="Due date"
            inputClasses="maxmins-w-100p rounded p-2 fredoka-reg is-clickable"
            format="yyyy-mm-dd hh:ii"
            bind:value={$newSubtaskDue}
            clearBtn={false}
            todayBtn={false}
            required={true}
        />
      </div>
    </div>

    <!-- task assignee/s -->
    <div class="maxmins-w-100p mt-3 is-relative">
      <MaterialApp>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div use:ClickOutside on:clickOutside={() => addSubtaskAssigneeDropOpen = false} on:click={() => addSubtaskAssigneeDropOpen = !addSubtaskAssigneeDropOpen} class="has-background-white-bis">
          <TextField
            color='grey' 
            outlined
            dense
            class='fredoka-reg'
            bind:value={searchingMemberInput}
            disabled={addingSubtask}
          >
            Assignee/s (type name or email)
          </TextField>
        </div>
      </MaterialApp>

      <div style='overflow-y: auto; transform-origin: top center;' class="pos-abs pos-l-0 pos-t-100p rounded maxmins-w-100p max-h-30v has-background-white elevation-2 p-2 has-transition rot-x-{addSubtaskAssigneeDropOpen ? '0' : '90'}">
        {#if localWorkspaceMembers.length != 0}
          {#each localWorkspaceMembers as wm}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div on:click={() => addSubtaskAssigneeDropOpen = true} class='mb-3'>
              <Checkbox color='green' bind:group value="{wm.id}">
                <div class='maxmins-w-100p is-flex is-align-items-center'>
                  <div>
                    <Avatar style='border: 1px solid rgba(0, 0, 0, 0.3);' size='18px'>
                      {#if wm.profile !== ''}
                        <img src="{wm.profile}" alt="{wm.lastName}">
                      {:else}
                        <Icon class='{wm.gender === 'Male' ? 'blue' : 'pink'}-text' path={mdiAccountOutline} />
                      {/if}
                    </Avatar>
                  </div>
                  
                  <div class="ml-3 fredoka-reg has-text-grey txt-size-12">
                    {wm.firstName} {wm.lastName} {`(${wm.email})`}
                  </div>
                </div>
              </Checkbox>
            </div>
          {/each}
        {:else}
          <div class='fredoka-reg has-text-grey'>
            There's no {searchingMemberInput} found
          </div>
        {/if}
      </div>
    </div>

    <div class='maxmins-w-100p flex-grow-1 is-flex is-flex-direction-column is-justify-content-flex-end'>
      <div class='maxmins-w-100p is-flex is-justify-content-flex-end'>
        <Button
          depressed
          class='has-background-grey-light has-text-white'
          disabled={addingSubtask}
          on:click={addSubtask}
        >
          {#if !addingSubtask}
            Create
          {:else}
            <Moon size={20} color="#000" />
          {/if}
        </Button>
      </div>
    </div>

  </div>
</div>