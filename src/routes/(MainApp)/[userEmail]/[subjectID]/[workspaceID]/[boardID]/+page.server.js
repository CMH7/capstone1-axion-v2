import prisma from '$lib/db';
import { error, redirect } from '@sveltejs/kit'

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
			id: {
				equals: params.boardID
			}
		}
	});
	if (!board) throw redirect(303, `/${user.email}/${subject.id}/${workspace.id}`);

	const tasks = await prisma.tasks.findMany({
		where: {
			status: board.id
		},
		select: {
			id: true,
			name: true,
			level: true,
			status: true,
			dueDateTime: true,
			members: true,
			parentTask: true
		}
	})

	const allMembers = await prisma.users.findMany({
		where: {
			OR: tasks.map(t => {return{OR: t.members.map(id => {return{id}})}})
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true
		}
	});

	/**
	 * @type {{taskID: string, members: {id: string, firstName: string, lastName: string, profile: string}[]}[]}
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