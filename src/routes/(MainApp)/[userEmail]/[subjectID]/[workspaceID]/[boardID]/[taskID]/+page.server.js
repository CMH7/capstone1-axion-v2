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
	if (!bcryptjs.compareSync(get(global_PASS), user.password)) throw error(402, 'Unauthorized accessing');

	const subject = await prisma.subjects.findFirst({
		where: {
			id: {
				equals: params.subjectID
			}
		}
	})

	if (!subject) throw error(404, 'Subject not found')
	
	const workspace = await prisma.workspaces.findFirst({
		where: {
			id: {
				equals: params.workspaceID
			}
		}
	})

	if (!workspace) throw error(404, 'Workspace not found')
	
	const board = await prisma.boards.findFirst({
		where: {
			id: {
				equals: params.boardID
			}
		}
	})

	if(!board) throw error(404, 'Board not found')

	const task = await prisma.tasks.findFirst({
		where: {
			id: {
				equals: params.taskID
			}
		}
	});

	if (!task) throw error(404, 'Task cannot be found');

	/** 
	 * @type {{id: string}[]} 
	 * */
	let subtasksConditions = []
	task.subtasks.forEach(staskID => {
		subtasksConditions = [...subtasksConditions, {id: staskID}]
	})

	const subtasks = await prisma.tasks.findMany({
		where: {
			OR: subtasksConditions
		}
	})

	/**
	 * @type {{id: string}[]}
	 */
	let membersCondition = []
	task.members.forEach(membersID => {
		membersCondition = [...membersCondition, {id: membersID}]
	})

	const members = await prisma.users.findMany({
		where: {
			OR: membersCondition
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			profile: true
		}
	})

	/**
	 * @type {{id: string}[]}
	 */
	let chatsConditions = []

	const chats = await prisma.chats.findMany({
		where: {
			OR: chatsConditions
		}
	})

	/**
	 * @type {{id: string}[]}
	 */
	let viewersConditions = []

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
	})

	
	return { user, subject, workspace, board, task, subtasks, members, chats, viewers };
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