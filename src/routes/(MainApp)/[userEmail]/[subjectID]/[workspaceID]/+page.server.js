//@ts-ignore
import prisma from '$lib/db';
import { error, invalid, redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { global_PASS, global_USERID } from '$lib/stores/global.store';
import bcryptjs from 'bcryptjs';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, depends }) {
	if (!get(global_PASS)) throw redirect(303, '/Signin');

	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});
	if (!user) throw error(404, 'Account not found');
	if (!bcryptjs.compareSync(get(global_PASS), user.password)) throw error(401, 'Unauthorized access');

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

	/** 
	 * @type {{AND: {id: string, isSubtask: boolean}}[]} 
	 * */
	let allTasksConditions = [];
	boards.map((board) => {
		board.tasks.map((id) => {
			allTasksConditions = [...allTasksConditions, { AND: {id, isSubtask: false} }];
		});
	});
	const allTasks = await prisma.tasks.findMany({
		where: {
			OR: allTasksConditions
		},
		select: {
			id: true,
			name: true,
			level: true,
			members: true,
			subtasks: true,
			dueDateTime: true,
			status: true
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
			if (allMembersConditions.filter(obj => obj.id === memberID).length == 0) {
				allMembersConditions = [...allMembersConditions, {id: memberID}]
			}
		})
	})
	const allMembers = await prisma.users.findMany({
		where: {
			OR: allMembersConditions
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

	const workspaceMembers = await prisma.users.findMany({
		where: {
			OR: workspace.members.map(id => {return {id}})
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

	return { workspace, user, boards, subject, boardTasks, taskMembers, statuses, workspaceMembers };
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
	updateWorkspace: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const workspaceID = data.get('id')?.toString();
		const addFavorite = data.get('addFavorite')?.toString()

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
      },
      select: {
        id: true
      }
    })

    if(!upatedUser) return invalid(500, {message: 'Failed to update favorites but is added to favorites, please reload', reason: 'databaseError'})

		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: workspaceID
			},
			data: {
				name,
				color
			},
			select: {
				id: true
			}
		});

		if (!updatedWorkspace)
			return invalid(500, {
				message: 'Database failure to update workspace',
				reason: 'databaseError'
			});
	},
	createTask: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		//@ts-ignore
		const level = parseInt(data.get('level')?.toString());
		const status = data.get('status')?.toString();
		const dueDateTime = data.get('dueDateTime')?.toString();
		const members = data.get('members')?.toString();

		const newTask = await prisma.tasks.create({
			data: {
				createdBy: get(global_USERID),
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
				conversations: [],
				//@ts-ignore
				members: members?.length > 0 ? members?.split(',') : [],
				subtasks: [],
				viewers: [get(global_USERID)]
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

		const updatedBoard = await prisma.boards.update({
			where: {
				id: status
			},
			data: {
				tasks: {
					push: newTask.id
				}
			},
			select: {
				id: true
			}
		});

		if (!updatedBoard.id)
			return invalid(500, {
				message: 'Task created but failed to be syncronized in boards, try again',
				reason: 'databaseError'
			});
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
	createBoard: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const workspaceID = data.get('workspaceID')?.toString();

		const newBoard = await prisma.boards.create({
			data: {
				//@ts-ignore
				color,
				filter: 'a1',
				//@ts-ignore
				name,
				tasks: []
			},
			select: {
				id: true,
				name: true
			}
		});

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

		toUpdateWorkspace.boards.splice(toUpdateWorkspace.boards.length - 1, 0, newBoard.id);

		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: workspaceID
			},
			data: {
				boards: toUpdateWorkspace.boards
			},
			select: {
				id: true
			}
		});

		if (!updatedWorkspace)
			return invalid(500, {
				message: "Can't update workspace, please try again 2",
				reason: 'databaseError'
			});

		return { name: newBoard.name, value: newBoard.id };
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
					equals: params.workspaceID
				}
			},
			select: {
				boards: true
			}
		});

		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: params.workspaceID
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
