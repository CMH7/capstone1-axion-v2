/* eslint-disable no-unused-vars */
import prisma from "$lib/db";
import { global_PASS } from "$lib/stores/global.store";
import { error, redirect, invalid } from "@sveltejs/kit";
import bcryptjs from 'bcryptjs';
import { get } from "svelte/store";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	if (!get(global_PASS)) throw redirect(301, '/Signin');

	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});

	if (!user) throw error(404, 'Account not found');
	if (!bcryptjs.compareSync(get(global_PASS), user.password))
		throw error(402, 'Unauthorized accessing');

	const tasks = await prisma.tasks.findMany({
		where: {
			AND: {
				members: {
					has: user.id
				},
				isSubtask: false
			}
		},
		select: {
			id: true,
			name: true,
			level: true,
			members: true,
			subtasks: true,
			dueDateTime: true,
			status: true,
    }
	});

	const boards = await prisma.boards.findMany({
		where: {
			OR: tasks.map((task) => {
				return { id: task.status };
			})
		},
		select: {
			id: true,
			name: true,
			color: true
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
			boards: true
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
			OR: workspaces.map(w => {return{workspaces: {has: w.id}}})
		}
	})

	return { user, tasks, boards, allMembers, subjects, workspaces, allStatusesAssignedToMe };
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
		global_PASS.set('');
		throw redirect(301, '/Signin');
	},
	updateTask: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		const status = data.get('status')?.toString();
		//@ts-ignore
		const level = parseInt(data.get('level')?.toString());
		const dueDateTime = data.get('dueDateTime')?.toString();
		const taskID = data.get('id')?.toString();

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
				id: true
			}
		});

		if (!updatedTask.id)
			return invalid(500, { message: 'Update failure on the task', reason: 'databaseError' });

		const updatedBoard = await prisma.boards.update({
			where: {
				id: status
			},
			data: {
				tasks: {
					push: updatedTask.id
				}
			}
		});
	},
	deleteTask: async ({ request }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();

		const deletedTask = await prisma.tasks.delete({
			where: {
				id: taskID
			},
			select: {
				conversations: true,
				subtasks: true,
				id: true,
				status: true
			}
		});

		if (!deletedTask.id)
			return invalid(500, {
				message: "Can't delete or remove task pleast try again later",
				reason: 'databaseError'
			});

		const toUpdateBoard = await prisma.boards.findFirst({
			where: {
				id: {
					equals: deletedTask.status
				}
			},
			select: {
				tasks: true,
				id: true
			}
		});

		if (!toUpdateBoard?.id)
			return invalid(404, {
				message: 'Board that a task is in cannot be found, please try again',
				reason: 'databaseError'
			});

		const updatedBoard = prisma.boards.update({
			where: {
				id: toUpdateBoard.id
			},
			data: {
				tasks: toUpdateBoard?.tasks.filter((id) => id !== deletedTask.id)
			}
		});

		const deletedSUBTasks = prisma.tasks.deleteMany({
			where: {
				OR: deletedTask.subtasks.map((id) => {
					return { id };
				})
			}
		});

		const deletedChats = prisma.chats.deleteMany({
			where: {
				OR: deletedTask.conversations.map((id) => {
					return { id };
				})
			}
		});

		const result = await prisma.$transaction([updatedBoard, deletedSUBTasks, deletedChats]);

		if (!result)
			return invalid(500, {
				message: 'Error in deleting subtasks and chats',
				reason: 'databaseError'
			});
	},
	updateBoard: async ({ request }) => {
		const data = await request.formData();
		const boardID = data.get('id')?.toString();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();

		const updatedBoard = await prisma.boards.update({
			where: {
				id: boardID
			},
			data: {
				name,
				color
			},
			select: {
				id: true
			}
		});

		if (!updatedBoard)
			return invalid(500, {
				message: "Can't update this board please try again later",
				reason: 'databaseError'
			});
	},
	deleteBoard: async ({ request, params }) => {
		const data = await request.formData();
		const boardID = data.get('id')?.toString();
		const move = data.get('move')?.toString();
		const moveToID = data.get('moveToID')?.toString();
		const workspaceID = data.get('workspaceID')?.toString()

		const toDeleteBoard = await prisma.boards.findFirst({
			where: {
				id: {
					equals: boardID
				}
			},
			select: {
				tasks: true,
				id: true
			}
		});

		if (move === 'move') {
			const toUpdateBoard = await prisma.boards.findFirst({
				where: {
					id: moveToID
				},
				select: {
					tasks: true
				}
			});

			//@ts-ignore
			// eslint-disable-next-line no-unsafe-optional-chaining
			const newTasks = [...toUpdateBoard?.tasks, ...toDeleteBoard?.tasks];

			const updatedBoard = await prisma.boards.update({
				where: {
					id: moveToID
				},
				data: {
					tasks: newTasks
				},
				select: {
					id: true
				}
			});

			const updatedTask = await prisma.tasks.updateMany({
				where: {
					OR: newTasks.map((id) => {
						return { id };
					})
				},
				data: {
					status: moveToID
				}
			});
		} else {
			const deletedTasks = await prisma.tasks.deleteMany({
				where: {
					//@ts-ignore
					OR: toDeleteBoard?.tasks.map((id) => {
						return { id };
					})
				}
			});
		}

		const deletedBoard = await prisma.boards.delete({
			where: {
				id: boardID
			},
			select: {
				id: true
			}
		});

		if (!deletedBoard)
			return invalid(500, {
				message: "Can't delete board, please try again later",
				reason: 'databaseError'
			});

		const toUpdateWorkspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: workspaceID
				}
			},
			select: {
				boards: true
			}
		});

		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: workspaceID
			},
			data: {
				boards: toUpdateWorkspace?.boards.filter((id) => id !== boardID)
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

		return { value: deletedBoard.id };
	}
};