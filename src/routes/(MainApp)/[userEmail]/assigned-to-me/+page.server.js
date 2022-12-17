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

		throw redirect(301, '/Signin');
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
		if (!subject) return invalid(404, { message: 'Subject not found', reason: 'databaseError' });

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
				boards: {
					has: deletedBoard.id
				}
			},
			select: {
				id: true,
				boards: true
			}
		});
		if(!toUpdateWorkspace) return invalid(404, {message: 'Workspace not found', reason: 'databaseError'})

		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: toUpdateWorkspace.id
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
	}
};