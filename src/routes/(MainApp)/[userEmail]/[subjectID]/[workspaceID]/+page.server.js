// @ts-nocheck
//@ts-ignore
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

	let boards = await prisma.boards.findMany({
		where: {
			OR: workspace.boards.map(id => {return{id}})
		}
	})

	/**
	 * @type {import('@prisma/client').boards[]}
	 */
	let tempBoards = []
	workspace.boards.forEach(board => {
		boards.every(board2 => {
			if (board2.id === board) {
				tempBoards = [...tempBoards, board2]
				return false
			}
			return true
		})
	})
	boards = tempBoards

	let statuses = boards.map((board) => {
		return {
			name: board.name,
			value: board.id
		};
	});

	const allTasks = await prisma.tasks.findMany({
		where: {
			OR: boards.map(b => {
				return {
					AND: {
						status: b.id,
						isSubtask: false
					}
				}
			})
		},
		select: {
			id: true,
			name: true,
			level: true,
			members: true,
			dueDateTime: true,
			status: true,
			description: true
		}
	});

	/** 
	 * @type {{boardID: string, bTasks: {id: string, name: string, level: number, members: string[], subtasks: string[], dueDateTime: Date, status: string}[]}[]}
	 * */
	let boardTasks = [];
	boards.forEach((board) => {
		boardTasks = [
			...boardTasks,
			{
				boardID: board.id,
				bTasks: allTasks.filter((task) => task.status === board.id).reverse()
			}
		];
	});

	const allMembers = await prisma.users.findMany({
		where: {
			OR: workspace.members.map(m => {return{id:m}})
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

	/** 
	 * @type {{taskID: string, members: {id: string, firstName: string, lastName: string, profile: string, online: boolean, email: string}[]}[]} 
	 * */
	let taskMembers = []
	allTasks.forEach(task => {
		taskMembers = [...taskMembers, {taskID: task.id, members: []}]
	})
	
	allMembers.forEach(member => {
		allTasks.forEach(task => {
			if (taskMembers.length != 0) {
				if (taskMembers.filter((tm) => tm.taskID === task.id).length != 0) {
					taskMembers.every((tm) => {
						if (tm.taskID === task.id) {
							if (task.members.includes(member.id)) {
								tm.members = [...tm.members, member]
							}
							return false;
						}
						return true;
					});
				} else {
					if (task.members.includes(member.id)) {
						taskMembers = [...taskMembers, { taskID: task.id, members: [member] }];
					}
				}
			} else {
				if (task.members.includes(member.id)) {
					taskMembers = [{taskID: task.id, members: [member]}]
				}
			}
		})
	})

	const workspaceMembers = allMembers

	return { workspace, user, boards, subject, boardTasks, taskMembers, statuses, workspaceMembers };
}

/** @type {import('./$types').Actions} */
export const actions = {
	updateWorkspace: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const workspaceID = data.get('id')?.toString();
		const addFavorite = data.get('addFavorite')?.toString();

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
		});
		if (!toUpdateUser) throw error(404, 'Account not found');

		// determine if to add or remove or nothing
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

			const upatedUser = await prisma.users.update({
				where: {
					id: toUpdateUser.id
				},
				data: {
					favorites: toUpdateUser.favorites
				}
			});
			if (!upatedUser)
				return invalid(500, {
					message: 'Failed to return data but is added to favorites, please reload',
					reason: 'databaseError'
				});
		}

		// get the data of the workspace
		const toUpdateWorkspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: workspaceID
				}
			}
		});
		if (!toUpdateWorkspace) return invalid(404, { message: 'Current workspace not found' });

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
					log: `${
						toUpdateWorkspace.name !== name
							? `renamed the workspace ${toUpdateWorkspace.name} to ${updatedWorkspace.name}`
							: toUpdateWorkspace.color !== color
							? `changed the color of the workspace ${updatedWorkspace.name} from ${toUpdateWorkspace.color} to ${updatedWorkspace.color}`
							: `renamed the workspace ${toUpdateWorkspace.name} to ${updatedWorkspace.name}`
					} and changed the color of the workspace ${updatedWorkspace.name} from ${
						toUpdateWorkspace.color
					} to ${updatedWorkspace.color}`,
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
	createTask: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		//@ts-ignore
		const level = parseInt(data.get('level')?.toString());
		const status = data.get('status')?.toString();
		const dueDateTime = data.get('dueDateTime')?.toString();
		const members = data.get('members')?.toString();
		const creator = data.get('creator')?.toString();

		// create new task
		const newTask = await prisma.tasks.create({
			data: {
				//@ts-ignore
				createdBy: creator,
				createdOn: new Date(),
				//@ts-ignore
				description,
				//@ts-ignore
				dueDateTime: new Date(dueDateTime),
				isSubtask: false,
				level,
				//@ts-ignore
				name,
				//@ts-ignore
				status,
				//@ts-ignore
				members: members?.length > 0 ? members?.split(',') : [],
				subtasks: [],
				//@ts-ignore
				viewers: [creator],
				parentTask: ''
			},
			select: {
				id: true
			}
		});
		if (!newTask.id)
			return invalid(403, {
				message: 'Database failure to create a task',
				reason: 'databaseError'
			});

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: params.workspaceID
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace is not found please reload',
				reason: 'databaseError'
			});
		
		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: creator,
				log: `created new task named ${newTask.name} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members
					.filter((m) => m !== creator)
					.map((m) => {
						return m;
					}),
				'updates',
				{}
			);
		}
	},
	updateTask: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		const status = data.get('status')?.toString();
		const oldStatus = data.get('oldStatus')?.toString();
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

			statMsg = `moved to ${updatedBoard.name}`
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
				log: `updated the task ${toUpdateTask.name} with a ${toUpdateTask.name !== updatedTask.name ? `new name of ${updatedTask.name}, ` : ''}${toUpdateTask.description !== updatedTask.description ? `new description, ` : ''}${toUpdateTask.dueDateTime !== updatedTask.dueDateTime ? `new due date-time of ${updatedTask.dueDateTime}, ` : ''}${toUpdateTask.level != updatedTask.level ? `new level/priority of ${updatedTask.level == 1 ? 'low' : updatedTask.level == 2 ? 'medium' : 'high'}, ` : ''}${toUpdateTask.status !== updatedTask.status ? `${statMsg} status, ` : ''} in ${workspace.name}`,
				logDate: new Date(),
				type: 'task',
				involve: workspace.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})
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
		})
		if (!newlog) return invalid(500, { message: 'Failed to log the process please try again', reason: 'databaseError' })
		
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
	},
	createBoard: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const workspaceID = data.get('workspaceID')?.toString();

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

		// create new board
		const newBoard = await prisma.boards.create({
			data: {
				//@ts-ignore
				color,
				//@ts-ignore
				name,
				parentWorkspace: workspaceID
			},
			select: {
				id: true,
				name: true
			}
		});
		if(!newBoard) return invalid(500, {message: 'Board creation failed please try again later', reason: 'databaseError'})

		// get the workspace before the update
		const toUpdateWorkspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: workspaceID
				}
			},
			select: {
				boards: true,
				id: true
			}
		});
		if (!toUpdateWorkspace)
			return invalid(500, {
				message: "Can't update workspace, please try again",
				reason: 'databaseError'
			});

		// insert the new board before the done board in the workspace
		toUpdateWorkspace.boards.splice(toUpdateWorkspace.boards.length - 1, 0, newBoard.id);

		// update the workspace
		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: workspaceID
			},
			data: {
				boards: toUpdateWorkspace.boards
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		});
		if (!updatedWorkspace)
			return invalid(500, {
				message: "Can't update workspace, please try again 2",
				reason: 'databaseError'
			});

		// get the parent subject
		const subject = await prisma.subjects.findFirst({
			where: {
				id: {
					equals: params.subjectID
				}
			},
			select: {
				id: true
			}
		});
		if (!subject) return invalid(404, { message: 'Subject not found', reason: 'databaseError' });

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `added new status/board ${newBoard.name} in workspace ${updatedWorkspace.name}`,
				logDate: new Date(),
				type: 'board',
				involve: updatedWorkspace.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again', reason: 'databaseError'})

		if (updatedWorkspace.members.length > 1) {
			pusherServer.trigger(
				updatedWorkspace.members
					.filter((m) => m !== cUser.id)
					.map((m) => {
						return m;
					}),
				'updates',
				{}
			);
		}

		return { name: newBoard.name, value: newBoard.id };
	},
	updateBoard: async ({ request, params }) => {
		const data = await request.formData();
		const boardID = data.get('id')?.toString();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();

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

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				boards: {
					has: boardID
				}
			},
			select: {
				id: true,
				name: true,
				members: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace is not found please reload',
				reason: 'databaseError'
			});

		// get the board before update
		const toUpdateBoard = await prisma.boards.findFirst({
			where: {
				id: {
					equals: boardID
				}
			},
			select: {
				id: true,
				color: true,
				name: true
			}
		});
		if (!toUpdateBoard)
			return invalid(404, {
				message: 'To update board is not found please reload',
				reason: 'databaseError'
			});

		// update the board
		const updatedBoard = await prisma.boards.update({
			where: {
				id: boardID
			},
			data: {
				name,
				color
			},
			select: {
				id: true,
				name: true,
				color: true
			}
		});
		if (!updatedBoard)
			return invalid(500, {
				message: "Can't update this board please try again later",
				reason: 'databaseError'
			});
		
		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `updated the board ${toUpdateBoard.name} with a ${toUpdateBoard.name !== name ? `new name of ${updatedBoard.name}, ` : ''}${toUpdateBoard.color !== color ? `new color of ${updatedBoard.color}` : ''} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'board',
				involve: workspace.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})

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
	},
	deleteBoard: async ({ request, params }) => {
		const data = await request.formData();
		const boardID = data.get('id')?.toString();
		const move = data.get('move')?.toString();
		const moveToID = data.get('moveToID')?.toString();

		// const workspaceID = data.get('workspaceID')?.toString();

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

		// get the workspace
		const workspace = await prisma.workspaces.findFirst({
			where: {
				boards: {
					has: boardID
				}
			}
		});
		if (!workspace)
			return invalid(404, {
				message: "Can't find workspace origin of the board",
				reason: 'databaseError'
			});

		// determine if the tasks are to be moved or to be deleted too
		if (move === 'move') {
			// update the status of the task to the latest board id
			// eslint-disable-next-line no-unused-vars
			const updatedTasks = await prisma.tasks.updateMany({
				where: {
					status: {
						equals: boardID
					}
				},
				data: {
					status: moveToID
				}
			});
		} else {
			// delete all the task with the same board id that is deleted
			// eslint-disable-next-line no-unused-vars
			const deletedTasks = await prisma.tasks.deleteMany({
				where: {
					status: {
						equals: boardID
					}
				}
			});
		}

		// delete the board
		const deletedBoard = await prisma.boards.delete({
			where: {
				id: boardID
			}
		});
		if (!deletedBoard)
			return invalid(500, {
				message: "Can't delete board, please try again later",
				reason: 'databaseError'
			});

		// remove the board in the workspace
		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: workspace.id
			},
			data: {
				boards: workspace.boards.filter((id) => id !== boardID)
			},
			select: {
				id: true
			}
		});
		if (!updatedWorkspace)
			return invalid(500, {
				message: "Can't update workspace boards lists, please try again later",
				reason: 'databaseError'
			});

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `deleted the status/board ${deletedBoard.name} and ${move === 'move' ? `moved all tasks under it to another status/board` : `deleted all tasks under it`} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'board',
				involve: workspace.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again', reason: 'databaseError'})
		
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

		return { value: deletedBoard.id };
	},
	leaveWorkspace: async ({ params }) => {
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
				lastName: true,
				subjects: true
			}
		});
		if (!cUser)
			return invalid(404, {
				message: 'Account not found please try again',
				reason: 'databaseError'
			});

		// get the workspace before leaving
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Workspace not found please try again later',
				reason: 'databaseError'
			});

		// update the members list of the workspace
		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: workspace.id
			},
			data: {
				members: workspace.members.filter((m) => m !== cUser.id),
				admins: workspace.admins.filter((a) => a !== cUser.id)
			}
		});
		if (!updatedWorkspace)
			return invalid(404, {
				message: 'Updated workspace not found please try again later',
				reason: 'databaseError'
			});
		
		// get all other workspaces that has the same parent subject
		const workspaces = await prisma.workspaces.findMany({
			where: {
				parentSubject: {
					equals: workspace.parentSubject
				}
			}
		})

		// determine if the current user is still existing to other workspace if not remove the current user to the master members list of the subject
		let existing = false
		workspaces.every(w => {
			if (w.members.includes(cUser.id)) {
				existing = true
				return false
			}
			return true
		})
		if (!existing) {
			// get the parent subject
			const subject = await prisma.subjects.findFirst({
				where: {
					id: {
						equals: workspace.parentSubject
					}
				}
			})
			if (!subject) return invalid(404, { message: 'Subject not found please try again later', reason: 'databaseError' })

			// update the parent subject's master members list
			const updatedSubject = await prisma.subjects.update({
				where: {
					id: workspace.parentSubject
				},
				data: {
					members: subject.members.filter(m => m !== cUser.id)
				}
			})
			if(!updatedSubject) return invalid(500, {message: 'Failed to update the parent subject please try again later', reason: 'databaseError'})
		}

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `leaved the workspce ${workspace.name}`,
				logDate: new Date(),
				type: 'workspace',
				involve: workspace.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})

		if (workspace.members.length > 1) {
			pusherServer.trigger(updatedWorkspace.members, 'updates', {});
		}
	}
};