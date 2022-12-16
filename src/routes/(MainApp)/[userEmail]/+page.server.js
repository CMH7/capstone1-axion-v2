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
      OR: user.subjects.map(id => {return{id}})
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
				online: {
					set: false
				}
			}
		});
		if (!user2) throw redirect(301, 'my-profile');
		throw redirect(301, '/Signin');
	},
	createSubject: async ({ request }) => {
		const data = await request.formData();
		const color = data.get('color')?.toString();
		const name = data.get('name')?.toString();
		const owner = data.get('owner')?.toString();

		const newSubject = await prisma.subjects.create({
			data: {
				//@ts-ignore
				color,
				//@ts-ignore
				name,
				//@ts-ignore
				owner,
				workspaces: []
			}
		});
		if (!newSubject)
			return invalid(404, {
				message: 'Error creating subject, A database error',
				reason: 'databaseError'
			});
		const user = await prisma.users.update({
			where: {
				id: owner
			},
			data: {
				subjects: {
					push: newSubject.id
				}
			}
		});
		if (!user)
			return invalid(404, {
				message: 'Subject created but an error in database occured upon referencing to subject',
				reason: 'databaseError'
			});
	},
	updateSubject: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const subjectID = data.get('id')?.toString();
		const addFavorite = data.get('addFavorite')?.toString();

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
		});
		if (!toUpdateUser) throw error(404, 'Account not found');

		if (addFavorite?.match('add')) {
			//@ts-ignore
			toUpdateUser.favorites[0].ids.push(subjectID);
		} else if (addFavorite?.match('rem')) {
			//@ts-ignore
			toUpdateUser.favorites[0].ids = toUpdateUser.favorites[0].ids.filter(
				(id) => id !== subjectID
			);
		}

		const upatedUser = await prisma.users.update({
			where: {
				id: toUpdateUser.id
			},
			data: {
				favorites: toUpdateUser.favorites
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

		const allWorkspaces = await prisma.workspaces.findMany({
			where: {
				OR: updatedSubject.workspaces.map((id) => {
					return { id };
				})
			}
		});

		/**
		 * @type {string[]}
		 */
		let allWorkspacesMembers = [];
		allWorkspaces.forEach((w) => {
			allWorkspacesMembers = [...allWorkspacesMembers, ...w.members];
		});

		let trs1 = [];
		allWorkspacesMembers.forEach((m) => {
			if (m !== cUser.id) {
				trs1 = [
					...trs1,
					prisma.notifications.create({
						data: {
							aMention: false,
							anInvitation: false,
							conversationID: '',
							for: {
								self: true,
								userID: cUser.id
							},
							fromInterface: {
								interf: '',
								subInterface: ''
							},
							fromTask: '',
							isRead: false,
							message: `${cUser.firstName} ${cUser.lastName}(owner) updated the subject ${updatedSubject.name}`
						},
						select: {
							id: true
						}
					})
				];
			}
		});
		const r1 = await prisma.$transaction(trs1);

		let trs2 = [];
		let i = 0;
		allWorkspacesMembers.forEach((m) => {
			if (m !== cUser.id) {
				trs2 = [
					...trs2,
					prisma.users.update({
						where: {
							id: m
						},
						data: {
							notifications: {
								push: r1[i].id
							}
						},
						select: {
							id: true
						}
					})
				];
				i++;
			}
		});
		const r2 = await prisma.$transaction(trs2);

		pusherServer.trigger(
			allWorkspacesMembers.filter((m) => m !== cUser.id),
			'updates',
			{}
		);
	},
	deleteSubject: async ({ request, params }) => {
		const data = await request.formData();
		const subjectID = data.get('id')?.toString();

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

		const deletedSubject = await prisma.subjects.delete({
			where: {
				id: subjectID
			}
		});
		if (!deletedSubject)
			return invalid(500, { message: 'Error in deleting subject, database related' });

		const users = await prisma.users.findMany({
			where: {
				subjects: {
					has: subjectID
				}
			},
			select: {
				id: true,
				subjects: true
			}
		});

		const trs = users.map((user) => {
			let newSubjectList = user.subjects.filter((id) => id !== subjectID);
			return prisma.users.update({
				where: {
					id: user.id
				},
				data: {
					subjects: {
						set: newSubjectList
					}
				}
			});
		});
		const results = await prisma.$transaction(trs);

		const allWorkspaces = await prisma.workspaces.findMany({
			where: {
				OR: deletedSubject.workspaces.map((id) => {
					return { id };
				})
			}
		});
		const allBoards = await prisma.boards.findMany({
			where: {
				OR: allWorkspaces.map((w) => {
					return {
						OR: w.boards.map((id) => {
							return { id };
						})
					};
				})
			}
		});
		const allTasks = await prisma.tasks.findMany({
			where: {
				OR: allBoards.map((b) => {
					return {
						OR: b.tasks.map((id) => {
							return { id };
						})
					};
				})
			}
		});

		/**
		 * @type {string[]}
		 */
		let allWorkspacesMembers = [];
		allWorkspaces.forEach((w) => {
			allWorkspacesMembers = [...allWorkspacesMembers, ...w.members];
		});

		const allTaskConvo = prisma.chats.deleteMany({
			where: {
				OR: allTasks.map((t) => {
					return {
						OR: t.conversations.map((id) => {
							return { id };
						})
					};
				})
			}
		});
		const allTaskRelatedNotifs = prisma.notifications.deleteMany({
			where: {
				OR: allTasks.map((t) => {
					return { fromTask: t.id };
				})
			}
		});
		const allDeletedTasks = prisma.tasks.deleteMany({
			where: {
				OR: allTasks.map((t) => {
					return { id: t.id };
				})
			}
		});
		const allDeletedBoards = prisma.boards.deleteMany({
			where: {
				OR: allBoards.map((b) => {
					return { id: b.id };
				})
			}
		});
		const allDeletedWorkspaces = prisma.workspaces.deleteMany({
			where: {
				OR: allWorkspaces.map((w) => {
					return { id: w.id };
				})
			}
		});
		const r1 = await prisma.$transaction([
			allTaskConvo,
			allTaskRelatedNotifs,
			allDeletedBoards,
			allDeletedTasks,
			allDeletedWorkspaces
		]);

		let trs2 = [];
		allWorkspacesMembers.forEach((m) => {
			if (m !== cUser.id) {
				trs2 = [
					...trs2,
					prisma.notifications.create({
						data: {
							aMention: false,
							anInvitation: false,
							conversationID: '',
							for: {
								self: true,
								userID: cUser.id
							},
							fromInterface: {
								interf: '',
								subInterface: ''
							},
							fromTask: '',
							isRead: false,
							message: `${cUser.firstName} ${cUser.lastName}(owner) deleted the subject ${deletedSubject.name}`
						},
						select: {
							id: true
						}
					})
				];
			}
		});
		const r2 = await prisma.$transaction(trs2);

		let i = 0;
		let trs3 = [];
		allWorkspacesMembers.forEach((m) => {
			if (m !== cUser.id) {
				trs3 = [
					...trs3,
					prisma.users.update({
						where: {
							id: m
						},
						data: {
							notifications: {
								push: r2[i].id
							}
						},
						select: {
							id: true
						}
					})
				];
				i++;
			}
		});
		const r3 = await prisma.$transaction(trs3);

		pusherServer.trigger(
			allWorkspacesMembers.filter((m) => m !== cUser.id),
			'updates',
			{}
		);
	},
	updateFavoriteSubjects: async ({ request }) => {
		const data = await request.formData();
		const subjectID = data.get('id')?.toString();
		const mode = data.get('mode')?.toString();
		const userID = data.get('userID')?.toString();

		let user = await prisma.users.findFirst({
			where: {
				id: {
					equals: userID
				}
			},
			select: {
				favorites: true
			}
		});

		if (!user) throw error(404, 'Account not found');

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
	}
};