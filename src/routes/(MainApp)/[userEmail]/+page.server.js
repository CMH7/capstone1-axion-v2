import pusherServer from '$lib/configs/helpers/realtime.server';
import prisma from '$lib/db';
import { redirect, error, invalid } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {  
  const user = await prisma.users.findFirst({
    where: {
      email: {
        equals: params.userEmail
      }
    }
  })
  if (!user) throw redirect(303, '/Signin')

  const subjects = await prisma.subjects.findMany({
    where: {
			members: {
				has: user.id
			}
    }
  })

  return {user, subjects}
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
		});
		if (!user) throw error(404, 'Account not found');
		const user2 = await prisma.users.update({
			where: {
				id: user.id
			},
			data: {
				online: false
			}
		});
		if (!user2) throw redirect(301, 'my-profile');
		throw redirect(302, '/Signin');
	},
	createSubject: async ({ request }) => {
		const data = await request.formData();
		const color = data.get('color')?.toString();
		const name = data.get('name')?.toString();
		const owner = data.get('owner')?.toString();

		// create new subject
		const newSubject = prisma.subjects.create({
			data: {
				//@ts-ignore
				color,
				//@ts-ignore
				name,
				//@ts-ignore
				owner,
				//@ts-ignore
				members: [owner]
			}
		})

		// create new log
		const newlog = prisma.logs.create({
			data: {
				//@ts-ignore
				commiter: owner,
				log: `created new subject named ${name}.`,
				logDate: new Date(),
				type: 'subject',
				//@ts-ignore
				involve: [owner]
			}
		});

		// execute in transaction => if one fails both of them will not execute
		const r1 = await prisma.$transaction([newSubject, newlog])
		if(r1.length < 2) return invalid(500, {message: 'Error in creating subject please try again', reason: 'databaseError'})
	},
	updateSubject: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const subjectID = data.get('id')?.toString();
		const addFavorite = data.get('addFavorite')?.toString();

		//get the user
		let cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				favorites: true,
				gender: true
			}
		});
		if (!cUser) throw error(404, 'Account not found');

		// check if the process contains marking favorites
		if (!addFavorite?.match("nothing")) {

			// check if to add or to remove from favorites list of the user
			if (addFavorite?.match('add')) {
				//@ts-ignore
				cUser.favorites[0].ids.push(subjectID);
			} else if (addFavorite?.match('rem')) {
				//@ts-ignore
				cUser.favorites[0].ids = cUser.favorites[0].ids.filter(
					(id) => id !== subjectID
				);
			}
			
			// update the current user
			const upatedUser = await prisma.users.update({
				where: {
					id: cUser.id
				},
				data: {
					favorites: cUser.favorites
				},
				select: {
					id: true
				}
			});
			if (!upatedUser)
				return invalid(500, {
					message: 'Failed to update favorites but is added to favorites, please reload',
					reason: 'databaseError'
				});
		}

		// get the subject for comparing data
		const subject = await prisma.subjects.findFirst({
			where: {
				id: {
					equals: subjectID
				}
			}
		})
		if(!subject) return invalid(404, {message: 'Subject not found please try again', reason: 'databaseError'})

		// check if there are changes in the name or color
		if (subject.name !== name || subject.color !== color) {
			// update the subject
			const updatedSubject = await prisma.subjects.update({
				where: {
					id: subjectID
				},
				data: {
					name,
					color
				}
			});
			if (!updatedSubject)
				return invalid(500, {
					message: 'Failed to return favorites, please reload',
					reason: 'databaseError'
				});
			
			// create new log
			const newlog = await prisma.logs.create({
				data: {
					commiter: cUser.id,
					log: `${subject.name !== updatedSubject.name && subject.color !== updatedSubject.color ? `renamed subject ${subject.name} to ${updatedSubject.name} and changed color from ${subject.color} to ${updatedSubject.color} of the subject ${updatedSubject.name}` : subject.color !== updatedSubject.color ? `changed color from ${subject.color} to ${updatedSubject.color} of the subject ${updatedSubject.name}` : subject.name !== updatedSubject.name ? `renamed subject ${subject.name} to ${updatedSubject.name}` : ''}`,
					logDate: new Date(),
					type: 'subject',
					involve: updatedSubject.members
				}
			})
			if(!newlog) return invalid(500, {message: 'Failed to log the process please try again, ERR_S_3', reason: 'databaseError'})
	
			if (updatedSubject.members.length > 1) {
				pusherServer.trigger(
					updatedSubject.members.filter((m) => m !== cUser?.id),
					'updates',
					{}
				);
			}
		}
	},
	deleteSubject: async ({ request, params }) => {
		const data = await request.formData();
		const subjectID = data.get('id')?.toString();

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
		if (!cUser) throw error(404, 'Account not found');

		// delete the subject
		const deletedSubject = await prisma.subjects.delete({
			where: {
				id: subjectID
			}
		});
		if (!deletedSubject)
			return invalid(500, { message: 'Error in deleting subject, database related' });

		// get all subject's workspaces
		const allWorkspaces = await prisma.workspaces.findMany({
			where: {
				parentSubject: deletedSubject.id
			}
		});

		// get all boards from all workspaces
		const allBoards = await prisma.boards.findMany({
			where: {
				OR: allWorkspaces.map(w => {
					return {
						parentWorkspace: w.id
					}
				})
			}
		});

		// get all tasks from the all boards
		const allTasks = await prisma.tasks.findMany({
			where: {
				OR: allBoards.map((b) => {
					return {
						status: b.id
					};
				})
			}
		});

		// delete all chats from all tasks
		const allTaskConvo = prisma.chats.deleteMany({
			where: {
				OR: allTasks.map(t => {
					return {
						parentTask: t.id
					}
				})
			}
		})

		// delete all tasks from all boards
		const allDeletedTasks = prisma.tasks.deleteMany({
			where: {
				OR: allTasks.map((t) => {
					return { id: t.id };
				})
			}
		});

		// delete all boards from all workspaces
		const allDeletedBoards = prisma.boards.deleteMany({
			where: {
				OR: allBoards.map((b) => {
					return { id: b.id };
				})
			}
		});

		// delete all workspaces from the subject
		const allDeletedWorkspaces = prisma.workspaces.deleteMany({
			where: {
				OR: allWorkspaces.map((w) => {
					return { id: w.id };
				})
			}
		});

		// execute all delete operations
		await prisma.$transaction([
			allTaskConvo,
			allDeletedBoards,
			allDeletedTasks,
			allDeletedWorkspaces
		])

		// create a new log
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `deleted the subject ${deletedSubject.name}`,
				logDate: new Date(),
				type: 'subject',
				involve: deletedSubject.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again, ERR_S_4', reason: 'databaseError'})

		pusherServer.trigger(
			deletedSubject.members.filter((m) => m !== cUser.id),
			'updates',
			{}
		);
	},
	updateFavoriteSubjects: async ({ request }) => {
		const data = await request.formData();
		const subjectID = data.get('id')?.toString();
		const mode = data.get('mode')?.toString();
		const userID = data.get('userID')?.toString();

		// get current user
		let user = await prisma.users.findFirst({
			where: {
				id: {
					equals: userID
				}
			},
			select: {
				id: true,
				gender: true,
				favorites: true
			}
		});
		if (!user) throw error(404, 'Account not found');

		// get the subject
		const subject = await prisma.subjects.findFirst({
			where: {
				id: {
					equals: subjectID
				}
			},
			select: {
				id: true,
				name: true
			}
		})
		if (!subject) return invalid(404, { message: 'Subject not found please try again later', reason: 'databaseError' })
		
		// set the mark for the subject
		user.favorites.every((fav) => {
			if (fav.for === 'subjects') {
				if (mode === 'set') {
					//@ts-ignore
					fav.ids.push(subjectID);
				} else {
					fav.ids = fav.ids.filter((id) => id !== subjectID);
				}
				return false;
			}
			return true;
		});

		// update the user's favorite subjects list
		let updatedUser = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				favorites: user.favorites
			},
			select: {
				id: true
			}
		});
		if (!updatedUser)
			return invalid(500, {
				message: 'Error setting as favorite in database',
				reason: 'databaseError'
			});
		
		// create a log for the current user
		const newlog = await prisma.logs.create({
			data: {
				commiter: user.id,
				log: `${mode === 'set' ? 'added' : 'removed'} ${subject.name} as ${user.gender === 'Male' ? 'his' : 'her'} favorite subject`,
				logDate: new Date(),
				type: 'subject',
				involve: [user.id]
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})
	}
};