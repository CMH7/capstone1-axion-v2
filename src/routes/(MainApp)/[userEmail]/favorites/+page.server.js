import pusherServer from "$lib/configs/helpers/realtime.server";
import prisma from "$lib/db";
import { error, redirect, invalid } from "@sveltejs/kit"

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});
	if (!user) throw redirect(303, '/Signin')

	const favsubjects = await prisma.subjects.findMany({
		where: {
			OR: user.favorites[0].ids.map(id => {return{id}})
		}
	});
	const favworkspaces = await prisma.workspaces.findMany({
		where: {
			OR: user.favorites[1].ids.map(id => {return{id}})
		}
	});
	const favtasks = await prisma.tasks.findMany({
		where: {
			OR: user.favorites[2].ids.map(id => {return{id}})
		},
		select: {
			id: true,
			name: true,
			dueDateTime: true,
			members: true,
			level: true,
			createdBy: true,
			isSubtask: true,
			status: true,
		}
	});

	const subjects = await prisma.subjects.findMany({
		where: {
			members: {
				has: user.id
			}
		}
	})

	const workspaces = await prisma.workspaces.findMany({
		where: {
			OR: subjects.map(s => {
				return {
					parentSubject: {
						equals: s.id
					}
				}
			})
		}
	})

	const allMembers = await prisma.users.findMany({
		where: {
			OR: favtasks.map(task => {
				return {
					OR: task.members.map(id => {return{id}})
				}
			})
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true,
			online: true,
			email: true
		}
	})

	const boards = await prisma.boards.findMany({
		where: {
			OR: favtasks.map((task) => {
				return { id: task.status };
			})
		},
		select: {
			id: true,
			name: true,
			color: true
		}
	});

	const allStatusesFavoritesa = await prisma.boards.findMany({
		where: {
			OR: workspaces.map((w) => {
				return {
					OR: w.boards.map((b) => {
						return { id: b };
					})
				};
			})
		},
		select: {
			id: true,
			name: true
		}
	});

	const allStatusesFavorites = allStatusesFavoritesa.map((asatm) => {
		return {
			value: asatm.id,
			name: asatm.name
		};
	});

	return { user, subjects, workspaces, boards, allMembers, allStatusesFavorites, favsubjects, favworkspaces, favtasks }
}


/** @type {import('./$types').Actions} */
export const actions = {
	updateWorkspace: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const workspaceID = data.get('id')?.toString();
		const addFavorite = data.get('addFavorite')?.toString();

		// get current user
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

		// determine if the workspace is being added or removed as favorite
		if (!addFavorite?.match('nothing')) {
			if (addFavorite?.match('add')) {
				//@ts-ignore
				toUpdateUser.favorites[1].ids.push(workspaceID);
			} else if (addFavorite?.match('rem')) {
				//@ts-ignore
				toUpdateUser.favorites[1].ids = toUpdateUser.favorites[1].ids.filter(
					(id) => id !== workspaceID
				);
			}

			// update the user favorites
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
					message: 'Failed to return data but is added to favorites, please reload',
					reason: 'databaseError'
				});
		}

		// get the initial data before the changes of the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: workspaceID
				}
			}
		});
		if (!workspace) return invalid(404, { message: 'Workspace not found please try again later' });

		// determine if there are changes in either the name or color of the workspace
		if (workspace.name !== name || workspace.color !== color) {
			// update the workspace data
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

			// create a log for all workspace members
			const newlog = await prisma.logs.create({
				data: {
					commiter: toUpdateUser.id,
					log: `${
						workspace.name !== updatedWorkspace.name
							? `renamed workspace ${workspace.name} to ${updatedWorkspace.name}`
							: workspace.color !== updatedWorkspace.color
							? `changed the color of the workspace ${workspace.name} from ${workspace.color} to ${updatedWorkspace.color}`
							: `renamed workspace ${workspace.name} to ${updatedWorkspace.name} and changed the color of the workspace ${workspace.name} from ${workspace.color} to ${updatedWorkspace.color}`
					}`,
					logDate: new Date(),
					type: 'workspace',
					involve: updatedWorkspace.members
				}
			});
			if (!newlog)
				return invalid(500, {
					message: 'Failed to log the process please try again later',
					reason: 'databaseError'
				});
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
		});
		if (!cUser)
			return invalid(404, {
				message: 'Account not found please re log in or reload',
				reason: 'databaseError'
			});

		// delete the workspace
		const deletedWorkspace = await prisma.workspaces.delete({
			where: {
				id: workspaceID
			}
		});
		if (!deletedWorkspace)
			return invalid(500, {
				message: 'Failed to delete workspace, please try again later',
				reason: 'databaseError'
			});

		// get all boards of the workspace
		const allBoards = await prisma.boards.findMany({
			where: {
				parentWorkspace: deletedWorkspace.id
			}
		});

		// get all tasks from the all boards of the workspace
		const allTasks = await prisma.tasks.findMany({
			where: {
				OR: allBoards.map((b) => {
					return {
						status: b.id
					};
				})
			}
		});

		// delete all chats in all tasks from the all boards of the workspace
		const allDeletedConvo = prisma.chats.deleteMany({
			where: {
				OR: allTasks.map((t) => {
					return {
						parentTask: t.id
					};
				})
			}
		});

		// delete all tasks from all boards of the workspace
		const allDeletedTasks = prisma.tasks.deleteMany({
			where: {
				OR: allTasks.map((t) => {
					return { id: t.id };
				})
			}
		});

		// delete all boards of the workspace
		const allDeletedBoards = prisma.boards.deleteMany({
			where: {
				OR: deletedWorkspace.boards.map((id) => {
					return { id };
				})
			}
		});

		// execute the transaction of deletions
		await prisma.$transaction([allDeletedBoards, allDeletedConvo, allDeletedTasks]);

		// create a log for all member of the workspace
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `deleted the workspace ${deletedWorkspace.name}`,
				logDate: new Date(),
				type: 'workspace',
				involve: deletedWorkspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});

		pusherServer.trigger(deletedWorkspace.members, 'updates', {});
	},
	updateFavoriteWorkspaces: async ({ request }) => {
		const data = await request.formData();
		const workspaceID = data.get('id')?.toString();
		const mode = data.get('mode')?.toString();
		const userID = data.get('userID')?.toString();

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
		if (!user) throw error(404, 'Account not found');

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
		});
		if (!workspace)
			return invalid(404, {
				message: 'Workspace cannot be found please try again later',
				reason: 'databaseError'
			});

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
				log: `${mode === 'set' ? 'added' : 'removed'} ${workspace.name} as ${
					user.gender === 'Male' ? 'his' : 'her'
				} favorite workspace`,
				logDate: new Date(),
				type: 'workspace',
				involve: [user.id]
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
				reason: 'databaseError'
			});
	},
	updateTask: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		const status = data.get('status')?.toString();
		const oldStatus = data.get('oldStatus')?.toString();
		// @ts-ignore
		const level = parseInt(data.get('level')?.toString());
		const dueDateTime = data.get('dueDateTime')?.toString();
		const taskID = data.get('id')?.toString();

		// get current user
		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			}
		});
		if (!cUser) throw error(404, 'Account not found');

		// get task before updates
		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: taskID
			},
			select: {
				name: true,
				id: true,
				level: true,
				status: true,
				description: true,
				dueDateTime: true
			}
		});
		if (!toUpdateTask)
			return invalid(404, {
				message: 'Task data cannot be found please try to reload',
				reason: 'databaseError'
			});

		// update the task
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				name: name,
				description: description,
				//@ts-ignore
				dueDateTime: new Date(dueDateTime),
				level: level,
				status: status
			},
			select: {
				name: true,
				id: true,
				level: true,
				status: true,
				description: true,
				dueDateTime: true
			}
		});
		if (!updatedTask.id)
			return invalid(500, { message: 'Update failure on the task', reason: 'databaseError' });

		// moves to new board/status
		let statMsg = '';
		if (oldStatus !== status) {
			// get the new board
			const updatedBoard = await prisma.boards.findFirst({
				where: {
					id: status
				}
			});
			if (!updatedBoard)
				return invalid(500, {
					message: 'Board not found please try again later',
					reason: 'databaseError'
				});

			statMsg = `moved to ${updatedBoard.name}`;
		}

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				boards: {
					has: updatedTask.status
				}
			},
			select: {
				id: true,
				name: true,
				members: true
			}
		});
		if (!workspace)
			return invalid(500, {
				message: 'Failed to fetch workspace data please try again.',
				reason: 'databaseError'
			});

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `updated the task ${toUpdateTask.name} with a ${
					toUpdateTask.name !== updatedTask.name ? `new name of ${updatedTask.name}, ` : ''
				}${toUpdateTask.description !== updatedTask.description ? `new description, ` : ''}${
					toUpdateTask.dueDateTime !== updatedTask.dueDateTime
						? `new due date-time of ${updatedTask.dueDateTime}, `
						: ''
				}${
					toUpdateTask.level != updatedTask.level
						? `new level/priority of ${
								updatedTask.level == 1 ? 'low' : updatedTask.level == 2 ? 'medium' : 'high'
						  }, `
						: ''
				}${toUpdateTask.status !== updatedTask.status ? `${statMsg} status, ` : ''} in ${
					workspace.name
				}`,
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
			if (
				toUpdateTask.name !== updatedTask.name ||
				toUpdateTask.description !== updatedTask.description ||
				toUpdateTask.dueDateTime !== updatedTask.dueDateTime ||
				toUpdateTask.level != updatedTask.level ||
				toUpdateTask.status !== updatedTask.status
			) {
				pusherServer.trigger(
					workspace.members
						.filter((m) => m !== cUser.id)
						.map((m) => {
							return m;
						}),
					'updates',
					{}
				);
			}
		}
	},
	deleteTask: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();

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

		// delete the task
		const deletedTask = await prisma.tasks.delete({
			where: {
				id: taskID
			}
		});
		if (!deletedTask.id)
			return invalid(500, {
				message: "Can't delete or remove task pleas try again later",
				reason: 'databaseError'
			});

		// delete all subtasks under of the parent task
		const deletedSUBTasks = prisma.tasks.deleteMany({
			where: {
				AND: {
					isSubtask: true,
					parentTask: deletedTask.id
				}
			}
		});

		// delete all chats under the parent task
		const deletedChats = prisma.chats.deleteMany({
			where: {
				parentTask: deletedTask.id
			}
		});

		// execute the transaction
		const result = await prisma.$transaction([deletedSUBTasks, deletedChats]);
		if (!result)
			return invalid(500, {
				message: 'Error in deleting subtasks and chats',
				reason: 'databaseError'
			});

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				boards: {
					has: deletedTask.status
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
				message: 'Current workspace data was not found please try again later',
				reason: 'databaseError'
			});

		// create a log for all members in the workspace
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `deleted the task ${deletedTask.name} in the workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members
					.filter((m) => m !== cUser.id)
					.map((m) => {
						return m;
					}),
				'updates',
				{}
			);
		}
	}
};