import { error, redirect } from '@sveltejs/kit'
import prisma from '$lib/db'

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

	const ownedSubjects = await prisma.subjects.findMany({
		where: {
			owner: {
				equals: user.id
			}
		},
		select: {
			id: true
		}
	})
	const ownedWorkspaces = await prisma.workspaces.findMany({
		where: {
			owner: {
				equals: user.id
			}
		},
		select: {
			id: true
		}
	})
	const joinedWorkspaces = await prisma.workspaces.findMany({
		where: {
			AND: {
				NOT: {
					owner: {
						equals: user.id
					}
				},
				members: {
					has: user.id
				}
			}
		},
		select: {
			id: true
		}
	})
	const createdTasks = await prisma.tasks.findMany({
		where: {
			createdBy: {
				equals: user.id
			}
		},
		select: {
			id: true
		}
	})
	const assignedTasks = await prisma.tasks.findMany({
		where: {
			members: {
				has: user.id
			}
		},
		select: {
			id: true,
		}
	})

	const ownedWorkspacesCount = ownedWorkspaces.length
	const ownedSubjectsCount = ownedSubjects.length
	const joinedWorkspacesCount = joinedWorkspaces.length
	const createdTasksCount = createdTasks.length
	const assignedTasksCount = assignedTasks.length
	const favoriteSubjectsCounts = user.favorites[0].ids.length
	const favoriteWorkspacesCounts = user.favorites[1].ids.length
	const favoriteTasksCounts = user.favorites[2].ids.length
	
	return {
		user,
		ownedSubjectsCount,
		ownedWorkspacesCount,
		joinedWorkspacesCount,
		createdTasksCount,
		assignedTasksCount,
		favoriteSubjectsCounts,
		favoriteWorkspacesCounts,
		favoriteTasksCounts
	};
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
    
    throw redirect(301, '/Signin')
	},
	newPic: async ({ request }) => {
		const data = await request.formData()

		console.log(data);
	}
}