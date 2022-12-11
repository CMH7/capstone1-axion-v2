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
	if (!user) throw error(401, 'Account not found')

	const subject = await prisma.subjects.findFirst({
		where: {
			id: {
				equals: params.subjectID
			}
		}
	})
	if(!subject) throw redirect(303, `/${user.email}`)

	let workspaces = await prisma.workspaces.findMany({
		where: {
			OR: subject.workspaces.map(id => {return {id}})
		},
		select: {
			id: true,
			color: true,
			name: true,
			owner: true,
			members: true
		}
	})

	let aMember = false
	workspaces.every(workspace => {
		if (workspace.members.includes(user.id)) {
			aMember = true
			return false
		}
		return true
	})

	if (!aMember && subject.owner !== user.id) {
		const updatedUser = await prisma.users.update({
			where: {
				id: user.id
			},
			data: {
				subjects: user.subjects.filter(id => id !== subject.id)
			}
		})
		if (!updatedUser) return invalid(500, { message: 'Updated user not found please reload', reason: 'databaseError' })
		
		workspaces = workspaces.filter(workspace => workspace.members.includes(user.id))
		return { workspaces, user, subject, aMember };
	} else {
		workspaces = workspaces.filter(workspace => workspace.members.includes(user.id))
		aMember = true
		return { workspaces, user, subject, aMember };
	}
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
    const data = await request.formData()
    const name = data.get('name')?.toString()
    const color = data.get('color')?.toString()
    const subjectID = data.get('id')?.toString()
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
      toUpdateUser.favorites[0].ids.push(subjectID)
    } else if (addFavorite?.match('rem')) {
      //@ts-ignore
      toUpdateUser.favorites[0].ids = toUpdateUser.favorites[0].ids.filter(id => id !== subjectID)
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

    const updatedSubject = await prisma.subjects.update({
      where: {
        id: subjectID
      },
      data: {
        name,
        color
      }
    })

    if(!updatedSubject) return invalid(500, {message: 'Failed to return favorites, please reload', reason: 'databaseError'})
  },
  deleteSubject: async ({ request }) => {
    const data = await request.formData()
    const subjectID = data.get('id')?.toString()

    const deletedSubject = await prisma.subjects.delete({
      where: {
        id: subjectID
      }
    })

    if (!deletedSubject) return invalid(500, { message: 'Error in deleting subject, database related' })
    
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
    })
    
    const trs = users.map(user => {
      let newSubjectList = user.subjects.filter(id => id !== subjectID)
      return prisma.users.update({
        where: {
          id: user.id
        },
        data: {
          subjects: {
            set: newSubjectList
          }
        }
      })
    })

    const results = await prisma.$transaction(trs)

    if(!results) return invalid(500, {message: 'Cannot delete this subject. Database operation failure occured'})
  },
  updateFavoriteSubjects: async ({ request }) => {
    const data = await request.formData()
    const subjectID = data.get('id')?.toString()
    const mode = data.get('mode')?.toString()
    const userID = data.get('userID')?.toString()

    let user = await prisma.users.findFirst({
      where: {
        id: {
          equals: userID
        }
      },
      select: {
        favorites: true
      }
    })

    if(!user) throw error(404, 'Account not found')

    user.favorites.every(fav => {
      if (fav.for === 'subjects') {
        if (mode === 'set') {
          //@ts-ignore
          fav.ids.push(subjectID)
        } else {
          fav.ids = fav.ids.filter(id => id !== subjectID)
        }
        return false
      }
      return true
    })

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
  },
	createWorkspace: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const color = data.get('color')?.toString();
		const subjectID = data.get('subjectID')?.toString();
		const creator = data.get('creator')?.toString()

		const todoBoard = await prisma.boards.create({
			data: {
				color: 'grey',
				filter: 'a1',
				name: 'Todo',
				tasks: []
			},
			select: {
				id: true
			}
		});
		if (!todoBoard.id)
			return invalid(500, {
				message: "Database failure, can't create todo board to continue",
				reason: 'databaseError'
			});

		const InprogressBoard = await prisma.boards.create({
			data: {
				color: 'info',
				filter: 'a1',
				name: 'In progress',
				tasks: []
			},
			select: {
				id: true
			}
		});
		if (!InprogressBoard.id)
			return invalid(500, {
				message: "Database failure, can't create In progress board to continue",
				reason: 'databaseError'
			});

		const DoneBoard = await prisma.boards.create({
			data: {
				color: 'success',
				filter: 'a1',
				name: 'Done',
				tasks: []
			},
			select: {
				id: true
			}
		});
		if (!DoneBoard.id)
			return invalid(500, {
				message: "Database failure, can't create Done board to continue",
				reason: 'databaseError'
			});

		const newWorkspace = await prisma.workspaces.create({
			data: {
				//@ts-ignore
				color,
				//@ts-ignore
				name,
				//@ts-ignore
				owner: creator,
				//@ts-ignore
				admins: [creator],
				boards: [todoBoard.id, InprogressBoard.id, DoneBoard.id],
				//@ts-ignore
				members: [creator]
			},
			select: {
				id: true
			}
		});
		if (!newWorkspace.id)
			return invalid(500, {
				message: "Database failure, can't create workspace to continue",
				reason: 'databaseError'
			});

		const updatedSubject = await prisma.subjects.update({
			where: {
				id: subjectID
			},
			data: {
				workspaces: {
					push: newWorkspace.id
				}
			},
			select: {
				id: true
			}
		});
		if (!updatedSubject.id)
			return invalid(500, {
				message: "Database failure, can't update subject to continue",
				reason: 'databaseError'
			});
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
    if(!upatedUser) return invalid(500, {message: 'Failed to return data but is added to favorites, please reload', reason: 'databaseError'})

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
		if(!deletedWorkspace) return invalid(500, {message: 'Failed to delete workspace, please try again later', reason: 'databaseError'})

		const allDeletedBoards = await prisma.boards.deleteMany({
			where: {
				OR: deletedWorkspace.boards.map(id => {return{id}})
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
		const userID = data.get('userID')?.toString()

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
		if(!user) throw error(404, 'Account not found')

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
	}
};