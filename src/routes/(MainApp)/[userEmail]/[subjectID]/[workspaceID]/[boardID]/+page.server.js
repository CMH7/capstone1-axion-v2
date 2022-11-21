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
			id: {
				equals: params.boardID
			}
		}
	});

	if (!board) throw error(404, 'Board is empty');

	/**
	 * @type {{id: string}[]}
	 */
	let tasksConditions = [];

	board.tasks.forEach((taskID) => {
		tasksConditions = [...tasksConditions, { id: taskID }];
	});

	const tasks = await prisma.tasks.findMany({
		where: {
			OR: tasksConditions
		}
	});

	/**
	 * @type {{id: string}[]}
	 * */
	let allMembersConditions = [];
	tasks.map((task) => {
		task.members.map((memberID) => {
			allMembersConditions = [...allMembersConditions, { id: memberID }];
		});
	});

	const allMembers = await prisma.users.findMany({
		where: {
			OR: allMembersConditions
		}
	});

	/**
	 * @type {{taskID: string, members: import('@prisma/client').users[]}[]}
	 * */
	let taskMembers = [];

	allMembers.forEach((member) => {
		tasks.forEach((task) => {
			if (taskMembers.filter((tm) => tm.taskID === task.id).length != 0) {
				taskMembers.every((tm) => {
					if (tm.taskID === task.id) {
						tm.members = [...tm.members, member];
						return false;
					}
					return true;
				});
			} else {
				taskMembers = [...taskMembers, { taskID: task.id, members: [member] }];
			}
		});
	});

	return { user, subject, workspace, board, tasks, taskMembers };
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