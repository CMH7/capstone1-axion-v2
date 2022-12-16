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
	})
	if (!subject) throw redirect(303, `/${user.email}`)
	
	const workspace = await prisma.workspaces.findFirst({
		where: {
			id: {
				equals: params.workspaceID
			}
		}
	})
	if (!workspace) throw redirect(303, `/${user.email}/${subject.id}`);

	if (!workspace.members.includes(user.id)) throw redirect(303, `/${user.email}/${subject.id}`);

	const anAdmin = workspace.admins.includes(user.id)

	const workspaceMembers = await prisma.users.findMany({
		where: {
			OR: workspace.members.map(id => {return { id }})
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true,
			online: true,
			email: true,
			gender: true
		}
	})

	let statuses = await prisma.boards.findMany({
		where: {
			OR: workspace.boards.map(id => {return{id}})
		},
		select: {
			id: true,
			name: true,
			color: true
		}
	})

	let task = await prisma.tasks.findFirst({
		where: {
			id: {
				equals: params.taskID
			}
		}
	});
	if (!task) throw error(404, 'Task cannot be found');

	const addViewer = !task.viewers.includes(user.id)

	if (addViewer) {
		task = await prisma.tasks.update({
			where: {
				id: task.id
			},
			data: {
				viewers: {
					push: user.id
				}
			}
		})
	}

	const board = await prisma.boards.findFirst({
		where: {
			id: {
				equals: task.status
			}
		}
	});
	if (!board) throw redirect(303, `/${user.email}/${subject.id}/${workspace.id}`);

	/**
	 * @type {{id: string, name: string, color: string}[]}
	 */
	let tempStatuses = []
	workspace.boards.forEach(board => {
		statuses.every(status => {
			if (status.id === board) {
				tempStatuses = [...tempStatuses, status]
				return false
			}
			return true
		})
	})
	statuses = tempStatuses

	let subtasks = await prisma.tasks.findMany({
		where: {
			OR: task.subtasks.map(id => {return{id}})
		}
	})

	subtasks = subtasks.reverse()

	const members = await prisma.users.findMany({
		where: {
			OR: task.members.map(id => {return{id}})
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			profile: true,
			online: true
		}
	})

	const chats = await prisma.chats.findMany({
		where: {
			OR: task.conversations.map(id => {return{id}})
		}
	})

	let viewers = await prisma.users.findMany({
		where: {
			OR: task.viewers.map(id => {return{id}})
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true,
			email: true
		}
	})

	const createdBy = await prisma.users.findFirst({
		where: {
			id: {
				equals: task.createdBy
			}
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true
		}
	})

	/**
	 * @type {{chatID: string, chatSender: {id: string, firstName: string, lastName: string, profile: string, online: boolean, gender: string}}[]}
	 */
	let chatChatSenders = []
	let chatChatSenders2 = await prisma.users.findMany({
		where: {
			OR: chats.map(c => {return{id: c.sender}})
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile: true,
			online: true,
			gender: true
		}
	})

	chats.forEach(chat => {
		chatChatSenders2.every(sender => {
			if (chat.sender === sender.id) {
				chatChatSenders = [...chatChatSenders, {
					chatID: chat.id,
					chatSender: sender
				}]
				return false
			}
			return true
		})
	})

	const subscriber = task.subscribers.includes(user.id)
	
	return { user, subject, workspace, workspaceMembers, board, task, subtasks, members, chats, chatChatSenders, viewers, createdBy, statuses, subscriber, anAdmin };
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
		})
		if(!user) throw error(404, 'Account not found')

		const user2 = await prisma.users.update({
			where: {
				id: user.id
			},
			data: {
				online: {
					set: false
				}
			}
		})
		if (!user2) throw redirect(301, 'my-profile')
		
    throw redirect(301, '/Signin')
	},
	taskRename: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const newName = data.get('name')?.toString()

		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: params.taskID
				}
			},
			select: {
				id: true,
				name: true,
				subscribers: true
			}
		})
		if(!toUpdateTask) return invalid(500, {message: 'Current task is not found please reload', reason: 'databaseError'})

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				name: newName
			},
			select: {
				id: true,
				name: true
			}
		})
		if (!updatedTask) return invalid(500, { message: 'Failed to update task name', reason: 'databaseError' })
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				members: true,
				name: true
			}
		})
		if (!workspace) return invalid(404, { message: 'Current workspace not found please reload', reason: 'databaseError' })

		if (workspace.members.length > 1) {
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

			let trs1 = []
			toUpdateTask.subscribers.forEach(s => {
				if (s !== cUser.id) {
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
								fromTask: updatedTask.id,
								isRead: false,
								message: `${cUser.firstName} ${cUser.lastName} renamed the task ${toUpdateTask.name} to ${updatedTask.name} in ${workspace.name}`
							},
							select: {
								id: true
							}
						})
					]
				}
			})
			const r1 = await prisma.$transaction(trs1)
	
			let trs2 = []
			let i = 0
			toUpdateTask.subscribers.forEach(s => {
				if (s !== cUser.id) {
					trs2 = [
						...trs2,
						prisma.users.update({
							where: {
								id: s
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
					]
					i++
				}
			})
			const r2 = await prisma.$transaction(trs2)

			pusherServer.trigger(workspace.members.filter(s => s !== cUser.id), 'updates', {})
		}
	},
	taskNewLevel: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		//@ts-ignore
		const newLevel = parseInt(data.get('level')?.toString())

		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: params.taskID
				}
			},
			select: {
				id: true,
				subscribers: true,
				level: true,
				name: true
			}
		})
		if(!toUpdateTask) return invalid(404, {message: 'Current task not found please reload', reason: 'databaseError'})

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				level: newLevel
			}
		})
		if (!updatedTask) return invalid(500, { message: 'Failed to update level of task please reload', reason: 'databaseError' })
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
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
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
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

			let trs1 = [];
			toUpdateTask.subscribers.forEach((s) => {
				if (s !== cUser.id) {
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
								fromTask: updatedTask.id,
								isRead: false,
								message: `${cUser.firstName} ${cUser.lastName} set the task ${toUpdateTask.name} to ${updatedTask.level == 1 ? 'lowest' : updatedTask.level == 2 ? 'medium' : 'highest'} priority in ${workspace.name}`
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
			toUpdateTask.subscribers.forEach((s) => {
				if (s !== cUser.id) {
					trs2 = [
						...trs2,
						prisma.users.update({
							where: {
								id: s
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
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskSetFav: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const setFav = data.get('setFav')?.toString()

		let cUser = await prisma.users.findFirst({
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
		if(!cUser) throw error(404, 'Account not found')

		if (setFav === 'set') {
			//@ts-ignore
			cUser.favorites[2].ids.push(taskID)
		} else {
			//@ts-ignore
			cUser.favorites[2].ids = cUser.favorites[2].ids.filter(id => id !== taskID)
		}

		const updatedUser = await prisma.users.update({
			where: {
				id: cUser.id
			},
			data: {
				favorites: cUser.favorites
			}
		})

		if(!updatedUser) return invalid(500, {message: 'Can\'t fetch updated data please reload', reason: 'databaseError'})
	},
	taskSetNewDue: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const newDue = data.get('newDue')?.toString()

		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: params.taskID
				}
			},
			select: {
				id: true,
				subscribers: true,
				dueDateTime: true,
				name: true
			}
		});
		if (!toUpdateTask)
			return invalid(404, {
				message: 'Current task not found please reload',
				reason: 'databaseError'
			});

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				dueDateTime: new Date(`${newDue?.split(' ').join('T')}:00Z`)
			},
			select: {
				id: true
			}
		})
		if (!updatedTask) return invalid(500, { message: 'Can\'t fetch updated data please reload', reason: 'databaseError' })
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
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
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
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

			let trs1 = [];
			toUpdateTask.subscribers.forEach((s) => {
				if (s !== cUser.id) {
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
								fromTask: updatedTask.id,
								isRead: false,
								message: `${cUser.firstName} ${cUser.lastName} set new due-date of task ${
									toUpdateTask.name
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

			let trs2 = [];
			let i = 0;
			toUpdateTask.subscribers.forEach((s) => {
				if (s !== cUser.id) {
					trs2 = [
						...trs2,
						prisma.users.update({
							where: {
								id: s
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
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskSetNewStatus: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const newStatus = data.get('status')?.toString()
		const oldStatus = data.get('oldStatus')?.toString()

		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: params.taskID
				}
			},
			select: {
				id: true,
				subscribers: true,
				dueDateTime: true,
				name: true
			}
		});
		if (!toUpdateTask)
			return invalid(404, {
				message: 'Current task not found please reload',
				reason: 'databaseError'
			});

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				status: newStatus
			},
			select: {
				id: true,
				name: true
			}
		})
		if (!updatedTask) return invalid(500, { message: 'Can\'t fetch updated data please reload', reason: 'databaseError' })
		
		let toUpdateOldBoard = await prisma.boards.findFirst({
			where: {
				id: {
					equals: oldStatus
				}
			},
			select: {
				id: true,
				tasks: true,
				name: true
			}
		})
		if (!toUpdateOldBoard) return invalid(500, { message: 'Can\'t fetch updated data please reload', reason: 'databaseError' })
		
		toUpdateOldBoard.tasks = toUpdateOldBoard.tasks.filter(id => id !== taskID)

		const updatedOldBoard = await prisma.boards.update({
			where: {
				id: oldStatus
			},
			data: {
				tasks: toUpdateOldBoard.tasks
			}
		})
		if(!updatedOldBoard) return invalid(500, {message: 'Failed to update leaving board', reason: 'databaseError'})

		const updatedBoard = await prisma.boards.update({
			where: {
				id: newStatus
			},
			data: {
				tasks: {
					push: taskID
				}
			},
			select: {
				id: true,
				name: true
			}
		})
		if(!updatedBoard) return invalid(500, {message: 'Failed to update receiving board', reason: 'databaseError'})
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
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
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
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

			let trs1 = [];
			toUpdateTask.subscribers.forEach((s) => {
				if (s !== cUser.id) {
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
								fromTask: updatedTask.id,
								isRead: false,
								message: `${cUser.firstName} ${cUser.lastName} move the task ${toUpdateTask.name} from ${toUpdateOldBoard?.name} to ${updatedBoard.name} in ${workspace.name}`
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
			toUpdateTask.subscribers.forEach((s) => {
				if (s !== cUser.id) {
					trs2 = [
						...trs2,
						prisma.users.update({
							where: {
								id: s
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
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			)
		}
	},
	taskSetDesc: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const desc = data.get('desc')?.toString()

		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: {
					equals: params.taskID
				}
			},
			select: {
				id: true,
				subscribers: true,
				dueDateTime: true,
				name: true
			}
		});
		if (!toUpdateTask)
			return invalid(404, {
				message: 'Current task not found please reload',
				reason: 'databaseError'
			});

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				description: desc
			},
			select: {
				id: true,
				name: true
			}
		})
		if (!updatedTask) return invalid(500, { message: 'Can\'t fetch updated data please reload', reason: 'databaseError' })
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
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
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
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

			let trs1 = [];
			toUpdateTask.subscribers.forEach((s) => {
				if (s !== cUser.id) {
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
								fromTask: toUpdateTask.id,
								isRead: false,
								message: `${cUser.firstName} ${cUser.lastName} set new description on task ${toUpdateTask.name} in ${workspace.name}`
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
			toUpdateTask.subscribers.forEach((s) => {
				if (s !== cUser.id) {
					trs2 = [
						...trs2,
						prisma.users.update({
							where: {
								id: s
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
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskSendChat: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const message = data.get('message')?.toString()

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
		if(!cUser) throw error(404, 'Account not found')

		const today = new Date().toISOString()
		
		const newChat = await prisma.chats.create({
			data: {
				//2022-12-03T13:12:32.864Z
				deliveredTime: new Date(`${today.split('T')[0]}T${today.split('T')[1].split(':')[0]}:${today.split('T')[1].split(':')[1]}:00.000-08:00`),
				edited: false,
				//@ts-ignore
				message,
				sender: cUser.id
			},
			select: {
				id: true
			}
		});
		if (!newChat) return invalid(404, { message: 'send but error in updating', reason: 'databaseError' })
		
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				conversations: {
					push: newChat.id
				}
			},
			select: {
				id: true,
				subscribers: true
			}
		})
		if (!updatedTask) return invalid(404, { message: 'send but error in updating task', reason: 'databaseError' });
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
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
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			)
		}
	},
	taskEditChat: async ({ request, params }) => {
		const data = await request.formData()
		const message = data.get('message')?.toString()
		const chatID = data.get('chatID')?.toString()

		const today = new Date().toISOString()

		const updatedChat = await prisma.chats.update({
			where: {
				id: chatID
			},
			data: {
				message: message,
				edited: true,
				deliveredTime: new Date(`${today.split('T')[0]}T${today.split('T')[1].split(':')[0]}:${today.split('T')[1].split(':')[1]}:00.000-08:00`),
			}
		})
		if (!updatedChat) return invalid(404, { message: 'edited but error in updating task', reason: 'databaseError' });
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
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
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			const updatedTask = await prisma.tasks.findFirst({
				where: {
					id: {
						equals: params.taskID
					}
				},
				select: {
					id: true,
					name: true,
					subscribers: true
				}
			});
			if (!updatedTask)
				return invalid(404, { message: 'Current task not found', reason: 'dataaseError' })
			
			const cUser = await prisma.users.findFirst({
				where: {
					email: {
						equals: params.userEmail
					}
				},
				select: {
					id: true,
					lastName: true,
					firstName: true
				}
			})
			if(!cUser) throw error(404, 'Account not found')

			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			)
		}
	},
	taskSubscribe: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const subsMode = data.get('subscribe')?.toString()

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
		})
		if(!cUser) throw error(404, 'Account not found')

		if (subsMode === 'sub') {
			const updatedTask = await prisma.tasks.update({
				where: {
					id: taskID
				},
				data: {
					subscribers: {
						push: cUser.id
					}
				}
			})

			if(!updatedTask) return invalid(500, {message: 'Subscribing is not available right now please try again later', reason: 'databaseError'})
		} else {
			const toUpdateTask = await prisma.tasks.findFirst({
				where: {
					id: {
						equals: taskID
					}
				},
				select: {
					subscribers: true
				}
			})
			if (!toUpdateTask) throw error(404, 'Task not found')
			
			const updatedTask = await prisma.tasks.update({
				where: {
					id: taskID
				},
				data: {
					subscribers: toUpdateTask.subscribers.filter(id => id !== cUser.id)
				},
				select: {
					id: true
				}
			})
			if (!updatedTask) return invalid(500, { message: 'Unsubscribing is not available right now please try again later', reason: 'databaseError' })
		}

		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
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
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			pusherServer.trigger(
				workspace.members.filter((m) => m !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskAddAssignee: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const memberID = data.get('memberID')?.toString()

		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				members: {
					push: memberID
				},
				subscribers: {
					push: memberID
				}
			},
			select: {
				id: true,
				name: true,
				subscribers: true
			}
		});
		if (!updatedTask) return invalid(500, { message: 'Error in adding new assignee', reason: 'databaseError' })
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
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
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			const cUser = await prisma.users.findFirst({
				where: {
					email: {
						equals: params.userEmail
					}
				},
				select: {
					id: true,
					lastName: true,
					firstName: true
				}
			});
			if (!cUser) throw error(404, 'Account not found');

			if (updatedTask.subscribers.filter(s => s !== cUser.id).length != 0) {
				const addedMember = await prisma.users.findFirst({
					where: {
						id: {
							equals: memberID
						}
					},
					select: {
						id: true,
						firstName: true,
						lastName: true,
						gender: true
					}
				})
				if (!addedMember) return invalid(404, { message: 'The user being added is not found please reload', reason: 'databaseError' })
	
				let trs1 = []
				updatedTask.subscribers.forEach(s => {
					if (s !== cUser.id) {
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
									fromTask: updatedTask.id,
									isRead: false,
									message: `${cUser.firstName} ${cUser.lastName} assigned ${s === memberID ? 'you' : `${cUser.id === addedMember.id ? `${addedMember.gender === 'Male' ? 'himself' : 'herself'}` : `${addedMember.firstName} ${addedMember.lastName}`} to the task ${updatedTask.name} in ${workspace.name}`}`
								},
								select: {
									id: true
								}
							})
						]
					}
				})
				if (trs1.length > 0) {
					const r1 = await prisma.$transaction(trs1)

					let trs2 = []
					let i = 0
					updatedTask.subscribers.forEach(s => {
						if (s !== cUser.id) {
							trs2 = [
								...trs2,
								prisma.users.update({
									where: {
										id: s
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
							]
							i++
						}
					})
					const r2 = await prisma.$transaction(trs2)
				}
			}

			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskRemAssignee: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const memberID = data.get('memberID')?.toString()

		const toUpdateTask = await prisma.tasks.findFirst({
			where: {
				id: taskID
			},
			select: {
				id: true,
				name: true,
				subscribers: true,
				members: true
			}
		});
		if (!toUpdateTask) return invalid(500, { message: 'Task cannot be found please reload', reason: 'databaseError' })
		
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				members: toUpdateTask.members.filter(id => id !== memberID)
			},
			select: {
				id: true,
				subscribers: true,
				name: true
			}
		})
		if (!updatedTask) return invalid(500, { message: 'Task cannot be found please reload', reason: 'databaseError' });
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
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
				message: 'Current workspace not found please reload',
				reason: 'databaseError'
			});

		if (workspace.members.length > 1) {
			const cUser = await prisma.users.findFirst({
				where: {
					email: {
						equals: params.userEmail
					}
				},
				select: {
					id: true,
					lastName: true,
					firstName: true
				}
			});
			if (!cUser) throw error(404, 'Account not found');

			if (toUpdateTask.subscribers.filter((s) => s !== cUser.id).length != 0) {
				const addedMember = await prisma.users.findFirst({
					where: {
						id: {
							equals: memberID
						}
					},
					select: {
						id: true,
						firstName: true,
						lastName: true,
						gender: true
					}
				});
				if (!addedMember)
					return invalid(404, {
						message: 'The user being added is not found please reload',
						reason: 'databaseError'
					});

				let trs1 = [];
				toUpdateTask.subscribers.forEach((s) => {
					if (s !== cUser.id) {
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
									fromTask: updatedTask.id,
									isRead: false,
									message: `${cUser.firstName} ${cUser.lastName} removed assignment on ${s === memberID ? 'you' : `${cUser.id === addedMember.id ? `${addedMember.gender === 'Male' ? 'himself' : 'herself'}` : `${addedMember.firstName} ${addedMember.lastName}`} to the task ${updatedTask.name} in ${workspace.name}`}`
								},
								select: {
									id: true
								}
							})
						];
					}
				});
				if (trs1.length > 0) {
					const r1 = await prisma.$transaction(trs1);

					let trs2 = [];
					let i = 0;
					toUpdateTask.subscribers.forEach((s) => {
						if (s !== cUser.id) {
							trs2 = [
								...trs2,
								prisma.users.update({
									where: {
										id: s
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
				}
			}

			pusherServer.trigger(
				workspace.members.filter((s) => s !== cUser.id),
				'updates',
				{}
			);
		}
	},
	taskAddSubtask: async ({ request, params }) => {
		const data = await request.formData()
		const taskID = data.get('id')?.toString()
		const name = data.get('name')?.toString()
		const desc = data.get('description')?.toString()
		//@ts-ignore
		const level = parseInt(data.get('level')?.toString())
		const status = data.get('status')?.toString()
		const due = data.get('due')?.toString()
		const assignees = data.get('assignees')?.toString()

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
				profile: true
			}
		})
		if (!cUser) throw error(404, 'Account not found')
		
		let subscribees = assignees?.split(',')[0] !== '' ? assignees?.split(',') : [];

		const newSubtask = await prisma.tasks.create({
			data: {
				createdBy: cUser.id,
				createdOn: new Date(),
				//@ts-ignore
				description: desc,
				dueDateTime: new Date(`${due?.split(' ')[0]}T${due?.split(' ')[1]}:00.000-08:00`),
				isSubtask: true,
				//@ts-ignore
				level,
				//@ts-ignore
				name,
				//@ts-ignore
				status,
				conversations: [],
				members: assignees?.split(',')[0] !== '' ? assignees?.split(',') : [],
				subscribers: [cUser.id],
				subtasks: [],
				viewers: [cUser.id, ...subscribees]
			},
			select: {
				id: true,
				name: true
			}
		});
		if(!newSubtask) return invalid(500, {message: 'Failed to create subtask, try again later', reason: 'databaseError'})
		
		const updatedTask = await prisma.tasks.update({
			where: {
				id: taskID
			},
			data: {
				subtasks: {
					push: newSubtask.id
				}
			}
		})
		if (!updatedTask) return invalid(500, { message: 'Creation success but failed to fetch data, please reload', reason: 'databaseError' })
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				name: true,
				members: true
			}
		})
		if (!workspace) return invalid(404, { message: 'Current workspace cannot be found please reload', reason: 'databaseError' })
		
		if (workspace.members.length > 1) {
			if (updatedTask.subscribers.length > 1) {
				let trs1 = []
				updatedTask.subscribers.forEach(s => {
					if (s !== cUser.id) {
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
									fromTask: updatedTask.id,
									isRead: false,
									message: `${cUser.firstName} ${cUser.lastName} added a new subtask '${newSubtask?.name}' to the task ${updatedTask.name} in ${workspace.name}`
								},
								select: {
									id: true
								}
							})
						]
					}
				})
				const r1 = await prisma.$transaction(trs1)

				let trs2 = []
				let i = 0
				updatedTask.subscribers.forEach(s => {
					if (s !== cUser.id) {
						trs2 = [
							...trs2,
							prisma.users.update({
								where: {
									id: s
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
						]
						i++
					} 
				})
				const r2 = await prisma.$transaction(trs2)
			}

			pusherServer.trigger(workspace.members.filter(m => m !== cUser.id), 'updates', {})
		}
	}
}