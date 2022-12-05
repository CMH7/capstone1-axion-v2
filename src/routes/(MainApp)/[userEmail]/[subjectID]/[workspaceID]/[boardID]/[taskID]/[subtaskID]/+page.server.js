import prisma from '$lib/db';
import { error, redirect, invalid } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { global_PASS } from '$lib/stores/global.store';
import bcryptjs from 'bcryptjs';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	if (!get(global_PASS)) throw redirect(303, '/Signin');

	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});

	if (!user) throw error(404, 'Account not found');
	if (!bcryptjs.compareSync(get(global_PASS), user.password))
		throw error(402, 'Unauthorized accessing');

	const subject = await prisma.subjects.findFirst({
		where: {
			id: {
				equals: params.subjectID
			}
		}
	});
	if (!subject) throw error(404, 'Subject not found');

	const workspace = await prisma.workspaces.findFirst({
		where: {
			id: {
				equals: params.workspaceID
			}
		}
	});
	if (!workspace) throw error(404, 'Workspace not found');

	const board = await prisma.boards.findFirst({
		where: {
			id: params.boardID
		}
	});
	if (!board) throw error(404, 'Board not found');

	const parentTask = await prisma.tasks.findFirst({
		where: {
			id: params.taskID
		}
	});
	if (!parentTask) throw error(404, 'Parent task not found');

	const task = await prisma.tasks.findFirst({
		where: {
			id: {
				equals: params.subtaskID
			}
		}
	});
	if (!task) throw error(404, 'Subtask not found');

	/**
	 * @type {{id: string}[]}
	 */
	let chatsConditions = task.conversations.map((id) => {
		return { id };
	});
	const chats = await prisma.chats.findMany({
		where: {
			OR: chatsConditions
		}
	});

	let statuses = await prisma.boards.findMany({
		where: {
			OR: workspace.boards.map((id) => {
				return { id };
			})
		},
		select: {
			id: true,
			name: true,
			color: true
		}
	});
	/**
	 * @type {{id: string, name: string, color: string}[]}
	 */
	let tempStatuses = [];
	workspace.boards.forEach((board) => {
		statuses.every((status) => {
			if (status.id === board) {
				tempStatuses = [...tempStatuses, status];
				return false;
			}
			return true;
		});
	});
	statuses = tempStatuses;

	const createdBy = await prisma.users.findFirst({
		where: {
			id: {
				equals: task.createdBy
			}
		}
	});

	/**
	 * @type {{chatID: string, chatSender: {id: string, firstName: string, lastName: string, profile: string, online: boolean}}[]}
	 */
	let chatChatSenders = [];
	let chatChatSenders2 = await prisma.users.findMany({
		where: {
			OR: chats.map(chat => {return{id:chat.sender}})
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true,
			online: true,
			gender: true
		}
	});
	chats.forEach((chat) => {
		chatChatSenders2.every((sender) => {
			if (chat.sender === sender.id) {
				chatChatSenders = [
					...chatChatSenders,
					{
						chatID: chat.id,
						chatSender: sender
					}
				];
				return false;
			}
			return true;
		});
	});

	/**
	 * @type {{id: string}[]}
	 */
	const sub2TasksConditions = task.subtasks.map(id => {
		return {id}
	})
	const subtasks = await prisma.tasks.findMany({
		where: {
			OR: sub2TasksConditions
		}
	})

	/**
	 * @type {{id: string}[]}
	 */
	let viewersConditions = task.viewers.map(id => {
		return {id}
	})
	let viewers = await prisma.users.findMany({
		where: {
			OR: viewersConditions
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true,
			email: true
		}
	});

	/**
	 * @type {{id: string}[]}
	 */
	let subtaskMembersConditions = task.members.map(id => {
		return {id}
	})
	const members = await prisma.users.findMany({
		where: {
			OR: subtaskMembersConditions
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			profile: true,
			online: true
		}
	});

	/**
	 * @type {{id: string}[]}
	 */
	const wsmConditions = workspace.members.map(id => {
		return {id}
	})
	const workspaceMembers = await prisma.users.findMany({
		where: {
			OR: wsmConditions
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true,
			online: true,
			email: true
		}
	});

	const subscriber = task.subscribers.includes(user.id)

	return { user, subject, workspace, board, parentTask, task, chats, statuses, createdBy, chatChatSenders, subtasks, viewers, members, workspaceMembers, subscriber };
}


/** @type {import('./$types').Actions} */
export const actions = {
	logout: async ({ params }) => {
		const user = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			}
		})

		if(!user) throw error(404, 'Account not found')

		const user2 = await prisma.users.update({
			where: {
				id: user.id
			},
			data: {
				online: {
					set: false
				}
			}
		})
		
		if(!user2) throw redirect(301, 'my-profile')
    global_PASS.set('')
    throw redirect(301, '/Signin')
  },
	taskRename: async ({ request }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const newName = data.get('name')?.toString()

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				name: newName
			},
			select: {
				id: true
			}
		})
		if(!updatedTask) return invalid(500, {message: 'Failed to update task name', reason: 'databaseError'})
	},
	taskNewLevel: async ({ request }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		//@ts-ignore
		const newLevel = parseInt(data.get('level')?.toString())	

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				level: newLevel
			}
		})

		if(!updatedTask) return invalid(500, {message: 'Failed to update level of task please reload', reason: 'databaseError'})
	},
	taskSetFav: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const setFav = data.get('setFav')?.toString()

		let user = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				favorites: true
			}
		})

		if(!user) throw error(404, 'Account not found')

		if (setFav === 'set') {
			//@ts-ignore
			user.favorites[2].ids.push(taskID)
		} else {
			//@ts-ignore
			user.favorites[2].ids = user.favorites[2].ids.filter(id => id !== taskID)
		}

		const updatedUser = await prisma.users.update({
			where: {
				id: user.id
			},
			data: {
				favorites: user.favorites
			}
		})

		if(!updatedUser) return invalid(500, {message: 'Can\'t fetch updated data please reload', reason: 'databaseError'})
	},
	taskSetNewDue: async ({ request }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const newDue = data.get('newDue')?.toString()

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				dueDateTime: new Date(`${newDue?.split(' ').join('T')}:00Z`)
			}
		})

		if(!updatedTask) return invalid(500, {message: 'Can\'t fetch updated data please reload', reason: 'databaseError'})
	},
	taskSetNewStatus: async ({ request }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const newStatus = data.get('status')?.toString()
		const oldStatus = data.get('oldStatus')?.toString()

		console.log(`new: ${newStatus}`);
		console.log(`old: ${oldStatus}`);
		console.log(`task: ${taskID}`);

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				status: newStatus
			}
		})

		if (!updatedTask) return invalid(500, { message: 'Can\'t fetch updated data please reload', reason: 'databaseError' })
		
		let toUpdateOldBoard = await prisma.boards.findFirst({
			where: {
				id: {
					equals: oldStatus
				}
			},
			select: {
				tasks: true
			}
		})

		if (!toUpdateOldBoard) return invalid(500, { message: 'Can\'t fetch updated data please reload', reason: 'databaseError' })
		
		toUpdateOldBoard.tasks = toUpdateOldBoard.tasks.filter(id => id !== taskID)

		const updatedOldBoard = prisma.boards.update({
			where: {
				id: oldStatus
			},
			data: {
				tasks: toUpdateOldBoard.tasks
			}
		})

		const updatedBoard = prisma.boards.update({
			where: {
				id: newStatus
			},
			data: {
				tasks: {
					push: taskID
				}
			}
		})

		const result = await prisma.$transaction([updatedOldBoard, updatedBoard])

		if(!result) return invalid(500, { message: 'Can\'t fetch updated data please reload', reason: 'databaseError' })
	},
	taskSetDesc: async ({ request }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const desc = data.get('desc')?.toString()

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				description: desc
			}
		})

		if(!updatedTask) return invalid(500, { message: 'Can\'t fetch updated data please reload', reason: 'databaseError' })
	},
	taskSendChat: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const message = data.get('message')?.toString()

		const user = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true
			}
		})

		if(!user) throw error(404, 'Account not found')

		const today = new Date().toISOString()
		
		const newChat = await prisma.chats.create({
			data: {
				//2022-12-03T13:12:32.864Z
				deliveredTime: new Date(`${today.split('T')[0]}T${today.split('T')[1].split(':')[0]}:${today.split('T')[1].split(':')[1]}:00.000-08:00`),
				edited: false,
				//@ts-ignore
				message,
				sender: user.id
			},
			select: {
				id: true
			}
		});

		if (!newChat) return invalid(404, { message: 'send but error in updating', reason: 'databaseError' })
		
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				conversations: {
					push: newChat.id
				}
			}
		})

		if(!updatedTask) return invalid(404, { message: 'send but error in updating task', reason: 'databaseError' });
	},
	taskEditChat: async ({ request }) => {
		const data = await request.formData()
		const message = data.get('message')?.toString()
		const chatID = data.get('chatID')?.toString()

		const today = new Date().toISOString()

		const updatedChat = await prisma.chats.update({
			where: {
				id: chatID
			},
			data: {
				message: message,
				edited: true,
				deliveredTime: new Date(`${today.split('T')[0]}T${today.split('T')[1].split(':')[0]}:${today.split('T')[1].split(':')[1]}:00.000-08:00`),
			}
		})

		if(!updatedChat) return invalid(404, { message: 'edited but error in updating task', reason: 'databaseError' });
	},
	taskSubscribe: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const subsMode = data.get('subscribe')?.toString()

		const user = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true
			}
		})

		if(!user) throw error(404, 'Account not found')

		if (subsMode === 'sub') {
			const updatedTask = await prisma.tasks.update({
				where: {
					id: taskID
				},
				data: {
					subscribers: {
						push: user.id
					}
				}
			})

			if(!updatedTask) return invalid(500, {message: 'Subscribing is not available right now please try again later', reason: 'databaseError'})
		} else {
			const toUpdateTask = await prisma.tasks.findFirst({
				where: {
					id: {
						equals: taskID
					}
				},
				select: {
					subscribers: true
				}
			})
			if (!toUpdateTask) throw error(404, 'Task not found')
			
			const updatedTask = await prisma.tasks.update({
				where: {
					id: taskID
				},
				data: {
					subscribers: toUpdateTask.subscribers.filter(id => id !== user.id)
				},
				select: {
					id: true
				}
			})
			if (!updatedTask) return invalid(500, { message: 'Unsubscribing is not available right now please try again later', reason: 'databaseError' })
		}
	},
	taskAddAssignee: async ({ request }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const memberID = data.get('memberID')?.toString()

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				members: {
					push: memberID
				}
			},
			select: {
				id: true
			}
		})
		if(!updatedTask) return invalid(500, {message: 'Error in adding new assignee', reason: 'databaseError'})
	},
	taskRemAssignee: async ({ request }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const memberID = data.get('memberID')?.toString()

		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: taskID
			},
			select: {
				id: true,
				members: true
			}
		})

		if (!toUpdateTask) return invalid(500, { message: 'Task cannot be found please reload', reason: 'databaseError' })
		
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				members: toUpdateTask.members.filter(id => id !== memberID)
			},
			select: {
				id: true
			}
		})

		if(!updatedTask) return invalid(500, { message: 'Task cannot be found please reload', reason: 'databaseError' });
	},
	taskAddSubtask: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const name = data.get('name')?.toString()
		const desc = data.get('description')?.toString()
		//@ts-ignore
		const level = parseInt(data.get('level')?.toString())
		const status = data.get('status')?.toString()
		const due = data.get('due')?.toString()
		const assignees = data.get('assignees')?.toString()

		const user = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				profile: true
			}
		})
		if(!user) throw error(404, 'Account not found')

		const newSubtask = await prisma.tasks.create({
			data: {
				createdBy: user.id,
				createdOn: new Date(),
				//@ts-ignore
				description: desc,
				dueDateTime: new Date(`${due?.split(' ')[0]}T${due?.split(' ')[1]}:00.000-08:00`),
				isSubtask: true,
				//@ts-ignore
				level,
				//@ts-ignore
				name,
				//@ts-ignore
				status,
				conversations: [],
				members: assignees?.split(','),
				subscribers: [user.id],
				subtasks: [],
				viewers: [user.id]
			},
			select: {
				id: true
			}
		});
		if(!newSubtask) return invalid(500, {message: 'Failed to create subtask, try again later', reason: 'databaseError'})
		
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				subtasks: {
					push: newSubtask.id
				}
			}
		})
		if(!updatedTask) return invalid(500, {message: 'Creation success but failed to fetch data, please reload', reason: 'databaseError'})
	}
}