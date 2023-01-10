/* eslint-disable no-unused-vars */
import pusherServer from "$lib/configs/helpers/realtime.server";
import prisma from "$lib/db"
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
	if (!user) throw error(404, 'Account not found')

	const tasks = await prisma.tasks.findMany({
		where: {
			AND: {
				members: {
					has: user.id
				},
				isSubtask: false
			}
		}
	});

	const boards = await prisma.boards.findMany({
		where: {
			OR: tasks.map((task) => {
				return { id: task.status };
			})
		}
	});

	const allMembers = await prisma.users.findMany({
		where: {
			OR: tasks.map(task => {
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
	});

	const workspaces = await prisma.workspaces.findMany({
		where: {
			OR: boards.map(board => {
				return {
					boards: {
						has: board.id
					}
				}
			})
		},
		select: {
			id: true,
			boards: true,
			parentSubject: true
		}
	})

	const allStatusesAssignedToMea = await prisma.boards.findMany({
		where: {
			OR: workspaces.map(w => {
				return {
					OR: w.boards.map(b => {return{id:b}})
				}
			})
		},
		select: {
			id: true,
			name: true
		}
	})

	const allStatusesAssignedToMe = allStatusesAssignedToMea.map(asatm => {
		return {
			value: asatm.id,
			name: asatm.name
		}
	})

	const subjects = await prisma.subjects.findMany({
		where: {
			OR: workspaces.map(w => {
				return {
					id: {
						equals: w.parentSubject
					}
				}
			})
		}
	})

	return { user, tasks, boards, allMembers, subjects, workspaces, allStatusesAssignedToMe };
}

/** @type {import('./$types').Actions} */
export const actions = {
	updateTask: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		const status = data.get('status')?.toString();
		const oldStatus = data.get('oldStatus')?.toString();
		//@ts-ignore
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
				log: `updated the board ${toUpdateBoard.name} with a ${
					toUpdateBoard.name !== name ? `new name of ${updatedBoard.name}, ` : ''
				}${
					toUpdateBoard.color !== color ? `new color of ${updatedBoard.color}` : ''
				} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'board',
				involve: workspace.members
			}
		});
		if (!newlog)
			return invalid(500, {
				message: 'Failed to log the process please try again later',
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
				log: `deleted the status/board ${deletedBoard.name} and ${
					move === 'move'
						? `moved all tasks under it to another status/board`
						: `deleted all tasks under it`
				} in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'board',
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

		return { value: deletedBoard.id };
	}
};