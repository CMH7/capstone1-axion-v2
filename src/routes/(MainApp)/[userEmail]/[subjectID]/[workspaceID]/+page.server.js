//@ts-ignore
import models from '$lib/models';
import prisma from '$lib/db';
import { error, redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { global_PASS } from '$lib/stores/global.store';
import { compareSync } from 'bcryptjs';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	try {
		if (!get(global_PASS)) throw redirect(303, '/Signin');

		const user = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			}
		});

		if (!user) throw error(404, 'Account not found');
		if (!compareSync(get(global_PASS), user.password)) throw error(401, 'Unauthorized access');

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

		if (!workspace) throw error(404, 'Workspace cannot be found');

		let boardsConditions = workspace.boards.map((boardID) => {
			return { id: boardID };
		})

		const boards = await prisma.boards.findMany({
			where: {
				OR: boardsConditions
			}
		})

		/** 
		 * @type {{id: string}[]} 
		 * */
		let allTasksConditions = [];
		boards.map((board) => {
			board.tasks.map((taskID) => {
				allTasksConditions = [...allTasksConditions, { id: taskID }];
			});
		});

		const allTasks = await prisma.tasks.findMany({
			where: {
				OR: allTasksConditions
			}
		});

		/** 
		 * @type {{boardID: string, bTasks: import('@prisma/client').tasks[]}[]}
		 * */
		let boardTasks = [];
		boards.forEach((board) => {
			boardTasks = [
				...boardTasks,
				{
					boardID: board.id,
					bTasks: allTasks.filter((task) => task.status === board.id)
				}
			];
		});

		/** 
		 * @type {{id: string}[]} 
		 * */
		let allMembersConditions = [];
		allTasks.map(task => {
			task.members.map(memberID => {
				allMembersConditions = [...allMembersConditions, {id: memberID}]
			})
		})

		const allMembers = await prisma.users.findMany({
			where: {
				OR: allMembersConditions
			}
		})

		/** 
		 * @type {{taskID: string, members: import('@prisma/client').users[]}[]} 
		 * */
		let taskMembers = []
		
		allMembers.forEach(member => {
			allTasks.forEach(task => {
				if (taskMembers.filter(tm => tm.taskID === task.id).length != 0) {
					taskMembers.every(tm => {
						if (tm.taskID === task.id) {
							tm.members = [...tm.members, member]
							return false
						}
						return true
					})
				} else {
					taskMembers = [...taskMembers, {taskID: task.id, members: [member]}]
				}
			})
		})

		return { workspace, user, boards, subject, boardTasks, taskMembers };
	} catch (e) {
		throw error(500, `hahahahha`)
	}
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
