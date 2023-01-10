import pusherServer from '$lib/configs/helpers/realtime.server';
import prisma from '$lib/db';
import { error, redirect, invalid } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});
	if (!user) throw error(404, 'Account not found')

	const subject = await prisma.subjects.findFirst({
		where: {
			id: {
				equals: params.subjectID
			}
		}
	});
	if (!subject) throw redirect(303, `/${user.email}`);

	const workspace = await prisma.workspaces.findFirst({
		where: {
			id: {
				equals: params.workspaceID
			}
		}
	});
	if (!workspace) throw redirect(303, `/${user.email}/${subject.id}`);

	if (!workspace.members.includes(user.id)) throw redirect(303, `/${user.email}/${subject.id}`);

	const board = await prisma.boards.findFirst({
		where: {
			id: params.boardID
		}
	});
	if (!board) throw redirect(303, `/${user.email}/${subject.id}/${workspace.id}`);

	const parentTask = await prisma.tasks.findFirst({
		where: {
			id: params.taskID
		}
	});
	if (!parentTask) throw redirect(303, `/${user.email}/${subject.id}/${workspace.id}`);

	const task = await prisma.tasks.findFirst({
		where: {
			id: {
				equals: params.subtaskID
			}
		}
	});
	if (!task) throw redirect(303, `/${user.email}/${subject.id}/${workspace.id}`);

	const chats = await prisma.chats.findMany({
		where: {
			parentTask: {
				equals: task.id
			}
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
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true
		}
	});

	/**
	 * @type {{chatID: string, chatSender: {id: string, firstName: string, lastName: string, profile: string, online: boolean}}[]}
	 */
	let chatChatSenders = [];
	let chatChatSenders2 = await prisma.users.findMany({
		where: {
			OR: chats.map(chat => {return{id: chat.sender}})
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

	let subtasks = await prisma.tasks.findMany({
		where: {
			parentTask: {
				equals: task.id
			}
		}
	})

	subtasks = subtasks.reverse()

	let viewers = await prisma.users.findMany({
		where: {
			OR: task.viewers.map(id => {return{id}})
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true,
			email: true
		}
	});

	const members = await prisma.users.findMany({
		where: {
			OR: task.members.map(id => {return{id}})
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

	const workspaceMembers = await prisma.users.findMany({
		where: {
			OR: workspace.members.map(id => {return{id}})
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

	return { user, subject, workspace, board, parentTask, task, chats, statuses, createdBy, chatChatSenders, subtasks, viewers, members, workspaceMembers, subtaskCount: subtasks.length };
}


/** @type {import('./$types').Actions} */
export const actions = {
	taskRename: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();
		const newName = data.get('name')?.toString();

		// get the current user
		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				gender: true,
				online: true,
				profile: true
			}
		});
		if (!cUser)
			return invalid(404, { message: 'Account not found please relogin', reason: 'databaseError' });

		// get the task before the renaming
		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: params.taskID
				}
			}
		});
		if (!toUpdateTask)
			return invalid(500, {
				message: 'Current task is not found please reload',
				reason: 'databaseError'
			});

		// rename the task
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				name: newName
			}
		});
		if (!updatedTask)
			return invalid(500, { message: 'Failed to update task name', reason: 'databaseError' });

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `renamed the task ${toUpdateTask.name} to ${updatedTask.name} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskNewLevel: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();
		//@ts-ignore
		const newLevel = parseInt(data.get('level')?.toString());

		// get the current user
		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				gender: true,
				online: true,
				profile: true
			}
		});
		if (!cUser)
			return invalid(404, { message: 'Account not found please relogin', reason: 'databaseError' });

		// get the task before updates on level
		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: params.taskID
				}
			}
		});
		if (!toUpdateTask)
			return invalid(404, {
				message: 'Current task not found please reload',
				reason: 'databaseError'
			});

		// update the task level
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				level: newLevel
			}
		});
		if (!updatedTask)
			return invalid(500, {
				message: 'Failed to update level of task please reload',
				reason: 'databaseError'
			});

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `set the task ${toUpdateTask.name} to ${
					newLevel == 1 ? 'low' : newLevel == 2 ? 'medium' : 'high'
				} level/priority in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskSetFav: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();
		const setFav = data.get('setFav')?.toString();

		// get the current user
		let cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				favorites: true,
				gender: true
			}
		});
		if (!cUser) throw error(404, 'Account not found');

		// determine if to set or unset as favorite task of the current user
		if (setFav === 'set') {
			//@ts-ignore
			cUser.favorites[2].ids.push(taskID);
		} else {
			//@ts-ignore
			cUser.favorites[2].ids = cUser.favorites[2].ids.filter((id) => id !== taskID);
		}

		// update the list of the tasks favorite of the current user
		const updatedUser = await prisma.users.update({
			where: {
				id: cUser.id
			},
			data: {
				favorites: cUser.favorites
			}
		});
		if (!updatedUser)
			return invalid(500, {
				message: "Can't fetch updated data please reload",
				reason: 'databaseError'
			});

		// get the task
		const task = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: taskID
				}
			},
			select: {
				id: true,
				name: true
			}
		});
		if (!task)
			return invalid(404, { message: 'Task not found please try again', reason: 'databaseError' });

		// create a log for the current user
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `${setFav === 'set' ? 'set' : 'remove'} task ${task.name} as ${
					cUser.gender === 'Male' ? 'his' : 'her'
				} favorite task`,
				logDate: new Date(),
				type: 'task',
				involve: [cUser.id]
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});
	},
	taskSetNewDue: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();
		const newDue = data.get('newDue')?.toString();

		// get the current user
		const cUser = await prisma.users.findFirst({
			where: {
				id: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});
		if (!cUser)
			return invalid(404, { message: 'Account not found please relogin', reason: 'databaseError' });

		// get the task before update
		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: params.taskID
				}
			},
			select: {
				id: true,
				dueDateTime: true,
				name: true
			}
		});
		if (!toUpdateTask)
			return invalid(404, {
				message: 'Current task not found please reload',
				reason: 'databaseError'
			});

		// update the task
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				dueDateTime: new Date(`${newDue?.split(' ').join('T')}:00Z`)
			}
		});
		if (!updatedTask)
			return invalid(500, {
				message: "Can't fetch updated data please reload",
				reason: 'databaseError'
			});

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		// create a log for all workspace member
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `changed the due date-time of the task ${updatedTask.name} to ${updatedTask.dueDateTime} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskSetNewStatus: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();
		const newStatus = data.get('status')?.toString();

		// get the current user
		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});
		if (!cUser)
			return invalid(404, { message: 'Account not found please relogin', reason: 'databaseError' });

		// get the task before the update
		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: params.taskID
				}
			}
		});
		if (!toUpdateTask)
			return invalid(404, {
				message: 'Current task not found please reload',
				reason: 'databaseError'
			});

		// update the task
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				status: newStatus
			},
			select: {
				id: true,
				name: true
			}
		});
		if (!updatedTask)
			return invalid(500, {
				message: "Can't fetch updated data please reload",
				reason: 'databaseError'
			});

		// get the board to move in
		const board = await prisma.boards.findFirst({
			where: {
				id: {
					equals: newStatus
				}
			}
		});
		if (!board)
			return invalid(500, { message: 'Failed to update receiving board', reason: 'databaseError' });

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `move the task ${updatedTask.name} to ${board.name} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskSetDesc: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();
		const desc = data.get('desc')?.toString();

		// get the current user
		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});
		if (!cUser)
			return invalid(404, { message: 'Account not found please relogin', reason: 'databaseError' });

		// get the task before update
		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: params.taskID
				}
			}
		});
		if (!toUpdateTask)
			return invalid(404, {
				message: 'Current task not found please reload',
				reason: 'databaseError'
			});

		// update the task
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				description: desc
			},
			select: {
				id: true,
				name: true
			}
		});
		if (!updatedTask)
			return invalid(500, {
				message: "Can't fetch updated data please reload",
				reason: 'databaseError'
			});

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `sets a new description to task ${updatedTask.name} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskSendChat: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();
		const message = data.get('message')?.toString();

		// get the current user
		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true
			}
		});
		if (!cUser) throw error(404, 'Account not found');

		const today = new Date().toISOString();

		// create new chat
		const newChat = await prisma.chats.create({
			data: {
				//2022-12-03T13:12:32.864Z
				deliveredTime: new Date(
					`${today.split('T')[0]}T${today.split('T')[1].split(':')[0]}:${
						today.split('T')[1].split(':')[1]
					}:00.000-08:00`
				),
				edited: false,
				//@ts-ignore
				message,
				sender: cUser.id,
				//@ts-ignore
				parentTask: taskID
			},
			select: {
				id: true
			}
		});
		if (!newChat)
			return invalid(404, { message: 'send but error in updating', reason: 'databaseError' });

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskEditChat: async ({ request, params }) => {
		const data = await request.formData();
		const message = data.get('message')?.toString();
		const chatID = data.get('chatID')?.toString();

		// get the current user
		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				lastName: true,
				firstName: true
			}
		});
		if (!cUser)
			return invalid(404, { message: 'Account not found please relogin', reason: 'databaseError' });

		const today = new Date().toISOString();

		// update the message of the chat
		const updatedChat = await prisma.chats.update({
			where: {
				id: chatID
			},
			data: {
				message: message,
				edited: true,
				deliveredTime: new Date(
					`${today.split('T')[0]}T${today.split('T')[1].split(':')[0]}:${
						today.split('T')[1].split(':')[1]
					}:00.000-08:00`
				)
			}
		});
		if (!updatedChat)
			return invalid(404, {
				message: 'edited but error in updating task',
				reason: 'databaseError'
			});

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskAddAssignee: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();
		const memberID = data.get('memberID')?.toString();

		// get the current user
		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});
		if (!cUser)
			return invalid(404, { message: 'Account not found please relogin', reason: 'databaseError' });

		// get the new assigned member on the task
		const newMember = await prisma.users.findFirst({
			where: {
				id: {
					equals: memberID
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});
		if (!newMember)
			return invalid(404, {
				message: 'Member not found please try again later',
				reason: 'databaseError'
			});

		// update the task members
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
				id: true,
				name: true
			}
		});
		if (!updatedTask)
			return invalid(500, { message: 'Error in adding new assignee', reason: 'databaseError' });

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `assigned ${newMember.firstName} ${newMember.lastName} to task ${updatedTask.name} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskRemAssignee: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();
		const memberID = data.get('memberID')?.toString();

		// get the current user
		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});
		if (!cUser)
			return invalid(404, { message: 'Account not found please relogin', reason: 'databaseError' });

		// get the removed member of the task
		const rUser = await prisma.users.findFirst({
			where: {
				id: {
					equals: memberID
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});
		if (!rUser)
			return invalid(404, {
				message: 'Member not found please try again later',
				reason: 'databaseError'
			});

		// get the task before update
		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: taskID
			},
			select: {
				id: true,
				name: true,
				members: true
			}
		});
		if (!toUpdateTask)
			return invalid(500, {
				message: 'Task cannot be found please reload',
				reason: 'databaseError'
			});

		// update the task members list
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				members: toUpdateTask.members.filter((id) => id !== memberID)
			},
			select: {
				id: true,
				name: true
			}
		});
		if (!updatedTask)
			return invalid(500, {
				message: 'Task cannot be found please reload',
				reason: 'databaseError'
			});

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `removed ${rUser.firstName} ${rUser.lastName} as assignee in the task ${updatedTask.name} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskAddSubtask: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();
		const name = data.get('name')?.toString();
		const desc = data.get('description')?.toString();
		//@ts-ignore
		const level = parseInt(data.get('level')?.toString());
		const status = data.get('status')?.toString();
		const due = data.get('due')?.toString();
		const assignees = data.get('assignees')?.toString();

		// get the current user
		const cUser = await prisma.users.findFirst({
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
		});
		if (!cUser) throw error(404, 'Account not found');

		// create new subtask
		const newSubtask = await prisma.tasks.create({
			data: {
				createdBy: cUser.id,
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
				members: assignees?.split(',')[0] !== '' ? assignees?.split(',') : [],
				viewers: [cUser.id],
				//@ts-ignore
				parentTask: taskID
			},
			select: {
				id: true,
				name: true
			}
		});
		if (!newSubtask)
			return invalid(500, {
				message: 'Failed to create subtask, try again later',
				reason: 'databaseError'
			});

		// get the parent task
		const pTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: taskID
				}
			},
			select: {
				id: true,
				name: true
			}
		});
		if (!pTask)
			return invalid(404, {
				message: 'Parent task not found please try again later',
				reason: 'databaseError'
			});

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				name: true,
				members: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace cannot be found please reload',
				reason: 'databaseError'
			});

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `added a new subtask ${newSubtask.name} to the task ${pTask.name} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((m) => m !== cUser.id),
				'updates',
				{}
			);
		}
	}
};