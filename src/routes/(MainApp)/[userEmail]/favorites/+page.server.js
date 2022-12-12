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
			subtasks: true,
			createdBy: true,
			isSubtask: true,
			status: true,
			subscribers: true
		}
	});
	const subjects = await prisma.subjects.findMany({
		where: {
			OR: user.subjects.map(id => {return{id}})
		}
	})
	const workspaces = await prisma.workspaces.findMany({
		where: {
			OR: subjects.map(s => {
				return {
					OR: s.workspaces.map(id => {return{id}})
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
	updateSubject: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const subjectID = data.get('id')?.toString();
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
	},
	deleteSubject: async ({ request }) => {
		const data = await request.formData();
		const subjectID = data.get('id')?.toString();

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
		if (!results)
			return invalid(500, {
				message: 'Cannot delete this subject. Database operation failure occured'
			});
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
				favorites: user?.favorites
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
				id: true
			}
		});
		if (!upatedUser)
			return invalid(500, {
				message: 'Failed to return data but is added to favorites, please reload',
				reason: 'databaseError'
			});

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
	deleteWorkspace: async ({ request }) => {
		const data = await request.formData();
		const workspaceID = data.get('id')?.toString();

		const deletedWorkspace = await prisma.workspaces.delete({
			where: {
				id: workspaceID
			},
			select: {
				id: true,
				boards: true
			}
		});
		if (!deletedWorkspace)
			return invalid(404, {
				message: 'Failed to delete workspace please try again later or reload the page',
				reason: 'databaseError'
			});

		const allDeletedBoards = await prisma.boards.deleteMany({
			where: {
				OR: deletedWorkspace.boards.map((id) => {
					return { id };
				})
			}
		});

		if (allDeletedBoards.count < 3)
			return invalid(404, {
				message:
					'Some boards are not deleted correctly please contact the developers on this issue',
				reason: 'databaseError'
			});
	},
	updateFavoriteWorkspaces: async ({ request }) => {
		const data = await request.formData();
		const workspaceID = data.get('id')?.toString();
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
	},
	updateTask: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		const status = data.get('status')?.toString();
		const oldStatus = data.get('oldStatus')?.toString();
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
				id: true,
				status: true
			}
		});
		if (!updatedTask.id) return invalid(500, { message: 'Update failure on the task', reason: 'databaseError' });

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
					id: true
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
					id: true
				}
			});
			if (!updatedBoard)
				return invalid(500, {
					message: 'Updated board data failed to fetch please reload',
					reason: 'databaseError'
				});
		}
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
			}
		});
		if(!updatedBoard) throw error(404, 'Failed to fetch data of board, please try again later')

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
};