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
			OR: boards.map(board => {
				return {
					OR: board.tasks.map(id => {return{AND: {id, isSubtask: false}}})
				}
			})
		},
		select: {
			id: true,
			name: true,
			level: true,
			members: true,
			subtasks: true,
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

		throw redirect(301, '/Signin');
	},
	updateWorkspace: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const workspaceID = data.get('id')?.toString();
		const addFavorite = data.get('addFavorite')?.toString();

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
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});
		if (!upatedUser)
			return invalid(500, {
				message: 'Failed to update favorites but is added to favorites, please reload',
				reason: 'databaseError'
			});

		const toUpdateWorkspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: workspaceID
				}
			},
			select: {
				id: true,
				name: true,
				color: true,
				members: true
			}
		});
		if (!toUpdateWorkspace)
			return invalid(500, {
				message: 'Database failure to update workspace',
				reason: 'databaseError'
			});
		
		const subject = await prisma.subjects.findFirst({
			where: {
				id: {
					equals: params.subjectID
				}
			},
			select: {
				id: true
			}
		})
		if(!subject) return invalid(404, {message: 'Subject not found', reason: 'databaseError'})

		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: workspaceID
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
		if (!updatedWorkspace)
			return invalid(500, {
				message: 'Database failure to update workspace',
				reason: 'databaseError'
			});

		if (toUpdateWorkspace.members.length > 1) {
			if (
				toUpdateWorkspace.name !== updatedWorkspace.name ||
				toUpdateWorkspace.color !== updatedWorkspace.color
			) {
				let trs1 = [];
				toUpdateWorkspace.members.forEach((m) => {
					if (m !== toUpdateUser.id) {
						trs1 = [
							...trs1,
							prisma.notifications.create({
								data: {
									aMention: false,
									anInvitation: false,
									conversationID: '',
									for: {
										self: true,
										userID: upatedUser.id
									},
									fromInterface: {
										interf: subject.id,
										subInterface: toUpdateWorkspace.id
									},
									fromTask: '',
									isRead: false,
									message: `${upatedUser.firstName} ${upatedUser.lastName} ${
										toUpdateWorkspace.name !== updatedWorkspace.name &&
										toUpdateWorkspace.color !== updatedWorkspace.color
											? `renamed and changed the color of the workspace ${updatedWorkspace.name}`
											: toUpdateWorkspace.name !== updatedWorkspace.name
											? `renamed ${toUpdateWorkspace.name} to ${updatedWorkspace.name}`
											: `changed the color to ${updatedWorkspace.color}`
									}`
								},
								select: {
									id: true
								}
							})
						];
					}
				});
				const result1 = await prisma.$transaction(trs1);

				let trs2 = [];
				let i = 0;
				toUpdateWorkspace.members.forEach((m) => {
					if (m !== toUpdateUser.id) {
						trs2 = [
							...trs2,
							prisma.users.update({
								where: {
									id: m
								},
								data: {
									notifications: {
										push: result1[i].id
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
				const result2 = await prisma.$transaction(trs2);

				pusherServer.trigger(toUpdateWorkspace.members, 'updates', {});
			}
		}
	},
	deleteWorkspace: async ({ request, params }) => {
		const data = await request.formData();
		const workspaceID = data.get('id')?.toString();

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

		const allBoards = await prisma.boards.findMany({
			where: {
				OR: deletedWorkspace.boards.map((id) => {
					return { id };
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

		const allDeletedConvo = prisma.chats.deleteMany({
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
		const allDeletedTaskRelatedNotifs = prisma.notifications.deleteMany({
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
				OR: deletedWorkspace.boards.map((id) => {
					return { id };
				})
			}
		});

		const r1 = await prisma.$transaction([
			allDeletedBoards,
			allDeletedConvo,
			allDeletedTasks,
			allDeletedTaskRelatedNotifs
		]);

		if (deletedWorkspace.members.length > 1) {
			const cUser = await prisma.users.findFirst({
				where: {
					email: {
						equals: params.userEmail
					}
				}
			});
			if (!cUser)
				return invalid(404, {
					message: 'Account not found please relogin or reload',
					reason: 'databaseError'
				});

			let trs2 = [];
			deletedWorkspace.members.forEach((m) => {
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
								message: `${cUser.firstName} ${cUser.lastName}(owner) deleted the workspace ${deletedWorkspace.name}`
							},
							select: {
								id: true
							}
						})
					];
				}
			});
			const r2 = await prisma.$transaction(trs2);

			let trs3 = [];
			let i = 0;
			deletedWorkspace.members.forEach((m) => {
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

			pusherServer.trigger(deletedWorkspace.members, 'updates', {});
		}
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
				conversations: [],
				//@ts-ignore
				members: members?.length > 0 ? members?.split(',') : [],
				subtasks: [],
				//@ts-ignore
				viewers: [creator],
				//@ts-ignore
				subscribers: [creator]
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

		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: params.workspaceID
			},
			select: {
				id: true,
				members: true
			}
		});
		if (!workspace)
			return invalid(404, {
				message: 'Current workspace is not found please reload',
				reason: 'databaseError'
			});

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

		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			}
		});
		if (!cUser) throw error(404, 'Account not found');

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

		let statMsg = '';
		if (oldStatus !== status) {
			let toUpdateBoard1 = await prisma.boards.findFirst({
				where: {
					//@ts-ignore
					id: oldStatus
				},
				select: {
					id: true,
					tasks: true
				}
			});
			if (!toUpdateBoard1) throw error(404, 'Board to update not found');

			toUpdateBoard1.tasks = toUpdateBoard1.tasks.filter((id) => id !== taskID);

			const updatedBoard1 = await prisma.boards.update({
				where: {
					id: toUpdateBoard1.id
				},
				data: {
					tasks: toUpdateBoard1.tasks
				},
				select: {
					id: true,
					name: true
				}
			});
			if (!updatedBoard1) throw error(404, 'Failed to fetch updated board data');

			const updatedBoard = await prisma.boards.update({
				where: {
					id: status
				},
				data: {
					tasks: {
						push: updatedTask.id
					}
				},
				select: {
					id: true,
					name: true
				}
			});
			if (!updatedBoard)
				return invalid(500, {
					message: 'Updated board data failed to fetch please reload',
					reason: 'databaseError'
				});

			statMsg = `${updatedBoard1.name} to ${updatedBoard.name}`;
		}

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

		if (workspace.members.length > 1) {
			if (
				toUpdateTask.name !== updatedTask.name ||
				toUpdateTask.description !== updatedTask.description ||
				toUpdateTask.dueDateTime !== updatedTask.dueDateTime ||
				toUpdateTask.level != updatedTask.level ||
				toUpdateTask.status !== updatedTask.status
			) {
				let trs1 = [];
				workspace.members.forEach((m) => {
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
										interf: subject.id,
										subInterface: workspace.id
									},
									fromTask: updatedTask.id,
									isRead: false,
									message: `${cUser.firstName} ${cUser.lastName} made an update to task ${
										toUpdateTask.name
									} => ${
										toUpdateTask.name !== updatedTask.name ? `renamed to ${updatedTask.name}.` : ''
									}, ${
										toUpdateTask.description !== updatedTask.description
											? 'sets new description'
											: ''
									}, ${
										toUpdateTask.dueDateTime != updatedTask.dueDateTime ? 'sets new due date' : ''
									} ${
										toUpdateTask.level != updatedTask.level
											? `sets priority to ${
													updatedTask.level == 1
														? 'lowest'
														: updatedTask.level == 2
														? 'medium'
														: 'highest'
											  }`
											: ''
									}, ${toUpdateTask.status !== updatedTask.status ? `move from ${statMsg}` : ''}`
								},
								select: {
									id: true
								}
							})
						];
					}
				});
				const result1 = await prisma.$transaction(trs1);
				if (!result1)
					return invalid(500, {
						message: 'Failed to generate notifications.',
						reason: 'databaseError'
					});

				let trs2 = [];
				let i = 0;
				workspace.members.forEach((m) => {
					if (m !== cUser.id) {
						trs2 = [
							...trs2,
							prisma.users.update({
								where: {
									id: m
								},
								data: {
									notifications: {
										push: result1[i].id
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
				const result2 = await prisma.$transaction(trs2);
				if (!result2)
					return invalid(500, {
						message: 'Failed to generate notifications on members.',
						reason: 'databaseError'
					});
			}

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
	deleteTask: async ({ request, params }) => {
		const data = await request.formData();
		const taskID = data.get('id')?.toString();

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

		const deletedTask = await prisma.tasks.delete({
			where: {
				id: taskID
			},
			select: {
				conversations: true,
				subtasks: true,
				id: true,
				status: true,
				name: true
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
		if (!toUpdateBoard)
			return invalid(404, {
				message: 'Board that a task is in cannot be found, please try again',
				reason: 'databaseError'
			});

		const updatedBoard = prisma.boards.update({
			where: {
				id: toUpdateBoard.id
			},
			data: {
				tasks: toUpdateBoard.tasks.filter((id) => id !== deletedTask.id)
			},
			select: {
				id: true,
				name: true
			}
		});
		if (!updatedBoard) throw error(404, 'Failed to fetch data of board, please try again later');

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

		const workspace = await prisma.workspaces.findFirst({
			where: {
				boards: {
					has: toUpdateBoard.id
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

		if (workspace.members.length > 1) {
			let trs1 = [];
			workspace.members.forEach((m) => {
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
								message: `${cUser.firstName} ${cUser.lastName} deleted task ${deletedTask.name} in ${workspace.name}`
							},
							select: {
								id: true
							}
						})
					];
				}
			});
			const res1 = await prisma.$transaction(trs1);
			if (!res1)
				return invalid(500, {
					message: 'Error in generating notifications please reload',
					reason: 'databaseError'
				});

			let trs2 = [];
			let i = 0;
			workspace.members.forEach((m) => {
				if (m !== cUser.id) {
					trs2 = [
						...trs2,
						prisma.users.update({
							where: {
								id: m
							},
							data: {
								notifications: {
									push: res1[i].id
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
			const res2 = await prisma.$transaction(trs2);
			if (!res2)
				return invalid(500, {
					message: 'Sending notifications to other members please reload',
					reason: 'databaseError'
				});

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

		if (updatedWorkspace.members.length > 1) {
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

			let trs1 = [];
			updatedWorkspace.members.forEach((m) => {
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
									interf: subject.id,
									subInterface: updatedWorkspace.id
								},
								fromTask: '',
								isRead: false,
								message: `${cUser.firstName} ${cUser.lastName} added new status/board '${newBoard.name}' in ${updatedWorkspace.name}`
							},
							select: {
								id: true
							}
						})
					];
				}
			});
			const r1 = await prisma.$transaction(trs1);
			if (!r1)
				return invalid(500, {
					message: 'Error in generating notifications for members.',
					reason: 'databaseError'
				});

			let trs2 = [];
			let i = 0;
			updatedWorkspace.members.forEach((m) => {
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
			if (!r2)
				return invalid(500, {
					message: 'Failed to send notifications for other member',
					reason: 'databaseError'
				});

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

		if (workspace.members.length > 1) {
			if (toUpdateBoard.name !== updatedBoard.name || toUpdateBoard.color !== updatedBoard.color) {
				const subject = await prisma.subjects.findFirst({
					where: {
						workspaces: {
							has: workspace.id
						}
					},
					select: {
						id: true
					}
				});
				if (!subject)
					return invalid(404, { message: 'Subject not found', reason: 'databaseError' });

				let trs1 = [];
				workspace.members.forEach((m) => {
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
										interf: subject.id,
										subInterface: workspace.id
									},
									fromTask: '',
									isRead: false,
									message: `${cUser.firstName} ${cUser.lastName} ${
										toUpdateBoard.name !== updatedBoard.name &&
										toUpdateBoard.color !== updatedBoard.color
											? `renamed a status ${toUpdateBoard.name} to ${updatedBoard.name} and changed the color`
											: toUpdateBoard.name !== updatedBoard.name
											? `renamed a status ${toUpdateBoard.name} to ${updatedBoard.name}`
											: `changed the color of status ${updatedBoard.name}`
									} in ${workspace.name}`
								},
								select: {
									id: true
								}
							})
						];
					}
				});
				const r1 = await prisma.$transaction(trs1);
				if (!r1)
					return invalid(500, {
						message: 'Error in generating notifications',
						reason: 'databaseError'
					});

				let trs2 = [];
				let i = 0;
				workspace.members.forEach((m) => {
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
				if (!r2)
					return invalid(500, { message: 'Failed to send notifications', reason: 'databaseError' });

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
	deleteBoard: async ({ request, params }) => {
		const data = await request.formData();
		const boardID = data.get('id')?.toString();
		const move = data.get('move')?.toString();
		const moveToID = data.get('moveToID')?.toString();

		const workspaceID = data.get('workspaceID')?.toString();

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
				message: "Can't find workspace origin of the board",
				reason: 'databaseError'
			});

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

			// eslint-disable-next-line no-unused-vars
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

			// eslint-disable-next-line no-unused-vars
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
			// eslint-disable-next-line no-unused-vars
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
				id: true,
				name: true
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

		if (workspace.members.length > 1) {
			let trs1 = [];
			workspace.members.forEach((m) => {
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
								message: `${cUser.firstName} ${cUser.lastName} deleted board/status ${deletedBoard.name} in ${workspace.name}`
							},
							select: {
								id: true
							}
						})
					];
				}
			});
			const r1 = await prisma.$transaction(trs1);
			if (!r1)
				return invalid(500, {
					messafe: 'Error in generating notifications',
					reason: 'databaseError'
				});

			let trs2 = [];
			let i = 0;
			workspace.members.forEach((m) => {
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
			if (!r2)
				return invalid(500, {
					messafe: 'Failed to send notifications on members',
					reason: 'databaseError'
				});

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
				subjects
			}
		});
		if (!cUser)
			return invalid(404, {
				message: 'Account not found please try again',
				reason: 'databaseError'
			});

		const updatedUser = await prisma.users.update({
			where: {
				id: cUser.id
			},
			data: {
				subjects: cUser.subjects.filter((s) => s !== params.subjectID)
			}
		});
		if (!updatedUser)
			return invalid(404, {
				message: 'Failed to clear subject on user please try again later',
				reason: 'databaseError'
			});

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

		let trs1 = [];
		updatedWorkspace.members.forEach((m) => {
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
						message: `${cUser.firstName} ${cUser.lastName} leaved the workspace ${updatedWorkspace.name}`
					},
					select: {
						id: true
					}
				})
			];
		});
		const r1 = await prisma.$transaction(trs1);

		let trs2 = [];
		let i = 0;
		updatedWorkspace.members.forEach((m) => {
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
		});
		const r2 = await prisma.$transaction(trs2);

		pusherServer.trigger(updatedWorkspace.members, 'updates', {});
	}
};