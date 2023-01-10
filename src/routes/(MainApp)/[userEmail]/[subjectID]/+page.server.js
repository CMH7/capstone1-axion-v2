import pusherServer from '$lib/configs/helpers/realtime.server';
import prisma from '$lib/db';
import { error, invalid, redirect } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});
	if (!user) throw error(401, 'Account not found')

	const subject = await prisma.subjects.findFirst({
		where: {
			id: {
				equals: params.subjectID
			}
		}
	})
	if(!subject) throw redirect(303, `/${user.email}`)

	let workspaces = await prisma.workspaces.findMany({
		where: {
			parentSubject: {
				equals: subject.id
			}
		},
		select: {
			id: true,
			color: true,
			name: true,
			owner: true,
			members: true
		}
	})

	let aMember = false
	workspaces.every(workspace => {
		if (workspace.members.includes(user.id)) {
			aMember = true
			return false
		}
		return true
	})

	if (!aMember && subject.owner !== user.id) {
		const updatedSubject = await prisma.subjects.update({
			where: {
				id: subject.id
			},
			data: {
				members: subject.members.filter(m => m !== user.id)
			}
		})
		if(!updatedSubject) return invalid(500, {message: 'Failed to update the subject please try again', reason: 'databaseError'})
		
		return { workspaces, user, subject, aMember };
	} else {
		aMember = true
		return { workspaces, user, subject, aMember };
	}
}

/** @type {import('./$types').Actions} */
export const actions = {
	createWorkspace: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const creator = data.get('creator')?.toString()

		// initial creation of workspace
		const newWorkspace = await prisma.workspaces.create({
			data: {
				//@ts-ignore
				color,
				//@ts-ignore
				name,
				//@ts-ignore
				owner: creator,
				//@ts-ignore
				admins: [creator],
				boards: [],
				//@ts-ignore
				members: [creator],
				parentSubject: params.subjectID
			}
		});
		if (!newWorkspace.id)
			return invalid(500, {
				message: "Database failure, can't create workspace to continue",
				reason: 'databaseError'
			});

		// create todo board
		const todoBoard = await prisma.boards.create({
			data: {
				color: 'grey',
				name: 'Todo',
				parentWorkspace: newWorkspace.id
			},
			select: {
				id: true
			}
		});
		if (!todoBoard.id)
			return invalid(500, {
				message: "Database failure, can't create todo board to continue",
				reason: 'databaseError'
			});

		// create in progress board
		const InprogressBoard = await prisma.boards.create({
			data: {
				color: 'info',
				name: 'In progress',
				parentWorkspace: newWorkspace.id
			},
			select: {
				id: true
			}
		});
		if (!InprogressBoard.id)
			return invalid(500, {
				message: "Database failure, can't create In progress board to continue",
				reason: 'databaseError'
			});

		// create done board
		const DoneBoard = await prisma.boards.create({
			data: {
				color: 'success',
				name: 'Done',
				parentWorkspace: newWorkspace.id
			},
			select: {
				id: true
			}
		});
		if (!DoneBoard.id)
			return invalid(500, {
				message: "Database failure, can't create Done board to continue",
				reason: 'databaseError'
			});

		// insert the boards in the new workspace
		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: newWorkspace.id
			},
			data: {
				boards: {
					set: [todoBoard.id, InprogressBoard.id, DoneBoard.id]
				}
			}
		})
		if (!updatedWorkspace) return invalid(500, { message: 'Workspace board creation failed, fatal error please try again later', reason: 'databaseError' })

		// create new log
		const newlog = await prisma.logs.create({
			data: {
				//@ts-ignore
				commiter: creator,
				log: `created a new workspace named ${newWorkspace.name}`,
				logDate: new Date(),
				type: 'workspace',
				//@ts-ignore
				involve: [creator]
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})

	},
	updateWorkspace: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const workspaceID = data.get('id')?.toString();
		const addFavorite = data.get('addFavorite')?.toString()

		// get the current user
    const toUpdateUser = await prisma.users.findFirst({
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
    if (!toUpdateUser) throw error(404, 'Account not found')

		// determine if to add or remove or nothing
		if (!addFavorite?.match('nothing')) {
			if (addFavorite?.match('add')) {
				//@ts-ignore
				toUpdateUser.favorites[1].ids.push(workspaceID)
			} else if (addFavorite?.match('rem')) {
				//@ts-ignore
				toUpdateUser.favorites[1].ids = toUpdateUser.favorites[1].ids.filter(id => id !== workspaceID)
			}

			const upatedUser = await prisma.users.update({
				where: {
					id: toUpdateUser.id
				},
				data: {
					favorites: toUpdateUser.favorites
				}
			})
			if(!upatedUser) return invalid(500, {message: 'Failed to return data but is added to favorites, please reload', reason: 'databaseError'})
		}

		// get the data of the workspace
		const toUpdateWorkspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: workspaceID
				}
			}
		})
		if(!toUpdateWorkspace) return invalid(404, {message: 'Current workspace not found'})

		// determine if there are changes in the workspace data
		if (toUpdateWorkspace.name !== name || toUpdateWorkspace.color !== color) {
			// update workspace data
			const updatedWorkspace = await prisma.workspaces.update({
				where: {
					id: workspaceID
				},
				data: {
					name,
					color
				}
			});
			if (!updatedWorkspace)
				return invalid(500, {
					message: 'Database failure to update workspace',
					reason: 'databaseError'
				});
			
			// create a log about it and logs it to all workspace members
			const newlog = await prisma.logs.create({
				data: {
					commiter: toUpdateUser.id,
					log: `${toUpdateWorkspace.name !== name ? `renamed the workspace ${toUpdateWorkspace.name} to ${updatedWorkspace.name}` : toUpdateWorkspace.color !== color ? `changed the color of the workspace ${updatedWorkspace.name} from ${toUpdateWorkspace.color} to ${updatedWorkspace.color}` : `renamed the workspace ${toUpdateWorkspace.name} to ${updatedWorkspace.name} and changed the color of the workspace ${updatedWorkspace.name} from ${toUpdateWorkspace.color} to ${updatedWorkspace.color}`}`,
					logDate: new Date(),
					type: 'workspace',
					involve: updatedWorkspace.members
				}
			})
			if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})
		}
	},
	deleteWorkspace: async ({ request, params }) => {
		const data = await request.formData();
		const workspaceID = data.get('id')?.toString();

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
		})
		if(!cUser) return invalid(404, {message: 'Account not found please re log in or reload', reason: 'databaseError'})

		// delete the workspace
		const deletedWorkspace = await prisma.workspaces.delete({
			where: {
				id: workspaceID
			}
		});
		if(!deletedWorkspace) return invalid(500, {message: 'Failed to delete workspace, please try again later', reason: 'databaseError'})

		// get all boards of the workspace
		const allBoards = await prisma.boards.findMany({
			where: {
				parentWorkspace: deletedWorkspace.id
			}
		})

		// get all tasks from the all boards of the workspace
		const allTasks = await prisma.tasks.findMany({
			where: {
				OR: allBoards.map(b => {
					return {
						status: b.id
					}
				})
			}
		})

		// delete all chats in all tasks from the all boards of the workspace
		const allDeletedConvo = prisma.chats.deleteMany({
			where: {
				OR: allTasks.map(t => {
					return {
						parentTask: t.id
					}
				})
			}
		})

		// delete all tasks from all boards of the workspace
		const allDeletedTasks = prisma.tasks.deleteMany({
			where: {
				OR: allTasks.map(t =>{return{id: t.id}})
			}
		})

		// delete all boards of the workspace
		const allDeletedBoards = prisma.boards.deleteMany({
			where: {
				OR: deletedWorkspace.boards.map(id => {return{id}})
			}
		});

		// execute the transaction of deletions
		await prisma.$transaction([allDeletedBoards, allDeletedConvo, allDeletedTasks])

		// create a log for all member of the workspace
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `deleted the workspace ${deletedWorkspace.name}`,
				logDate: new Date(),
				type: 'workspace',
				involve: deletedWorkspace.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})

		pusherServer.trigger(deletedWorkspace.members, 'updates', {})
	},
	updateFavoriteWorkspaces: async ({ request }) => {
		const data = await request.formData();
		const workspaceID = data.get('id')?.toString();
		const mode = data.get('mode')?.toString();
		const userID = data.get('userID')?.toString()

		// get the current user
		let user = await prisma.users.findFirst({
			where: {
				id: {
					equals: userID
				}
			},
			select: {
				id: true,
				favorites: true,
				gender: true
			}
		});
		if (!user) throw error(404, 'Account not found')
		
		// get the workspace name only
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: workspaceID
				}
			},
			select: {
				id: true,
				name: true
			}
		})
		if(!workspace) return invalid(404, {message: 'Workspace cannot be found please try again later', reason: 'databaseError'})

		// determine if to mark or unmark as favorite the workspace
		user.favorites.every((fav) => {
			if (fav.for === 'workspaces') {
				if (mode === 'set') {
					//@ts-ignore
					fav.ids.push(workspaceID);
				} else {
					fav.ids = fav.ids.filter((id) => id !== workspaceID);
				}
				return false;
			}
			return true;
		});

		// update the list of workspace favorites on the user
		let updatedUser = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				favorites: user?.favorites
			},
			select: {
				id: true
			}
		});
		if (!updatedUser.id)
			return invalid(404, {
				message: 'Database failure to return data that is updated please reload',
				reason: 'databaseError'
			});
		
		// create a log for the current user
		const newlog = await prisma.logs.create({
			data: {
				commiter: user.id,
				log: `${mode === 'set' ? 'added' : 'removed'} ${workspace.name} as ${user.gender === 'Male' ? 'his' : 'her'} favorite workspace`,
				logDate: new Date(),
				type: 'workspace',
				involve: [user.id]
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})
	}
};