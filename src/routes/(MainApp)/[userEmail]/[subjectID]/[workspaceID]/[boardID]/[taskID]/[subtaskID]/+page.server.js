import prisma from '$lib/db';
import { error, redirect } from '@sveltejs/kit';
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

	const subtask = await prisma.tasks.findFirst({
		where: {
			id: {
				equals: params.subtaskID
			}
		}
	});
	if (!subtask) throw error(404, 'Subtask not found');

	/**
	 * @type {{id: string}[]}
	 */
	let chatsConditions = subtask.conversations.map((id) => {
		return { id };
	});
	const chats = await prisma.chats.findMany({
		where: {
			OR: chatsConditions
		}
	});

	/**
	 * @type {{id: string}[]}
	 */
	let statusesConditions = workspace.boards.map((boardID) => {
		return { id: boardID };
	});
	let statuses = await prisma.boards.findMany({
		where: {
			OR: statusesConditions
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
				equals: subtask.createdBy
			}
		}
	});

	/**
	 * @type {{chatID: string, chatSender: {id: string, firstName: string, lastName: string, profile: string, online: boolean}}[]}
	 */
	let chatChatSenders = [];
	/**
	 * @type {{id: string}[]}
	 */
	let chatChatSendersConditions = chats.map((chat) => {
		return { id: chat.sender };
	});
	let chatChatSenders2 = await prisma.users.findMany({
		where: {
			OR: chatChatSendersConditions
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true,
			online: true
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
	const sub2TasksConditions = subtask.subtasks.map(id => {
		return {id}
	})
	const sub2Tasks = await prisma.tasks.findMany({
		where: {
			OR: sub2TasksConditions
		}
	})

	/**
	 * @type {{id: string}[]}
	 */
	let viewersConditions = subtask.viewers.map(id => {
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
	let subtaskMembersConditions = subtask.members.map(id => {
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

	return { user, subject, workspace, board, parentTask, subtask, chats, statuses, createdBy, chatChatSenders, sub2Tasks, viewers, members, workspaceMembers };
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
  }
}