import prisma from '$lib/db';
import { redirect, error, invalid } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {  
  const user = await prisma.users.findFirst({
    where: {
      email: {
        equals: params.userEmail
      }
    }
  })
  if (!user) throw redirect(303, '/Signin')

  const subjects = await prisma.subjects.findMany({
    where: {
      OR: user.subjects.map(id => {return{id}})
    }
  })

  return {user, subjects}
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
		if(!user2) throw redirect(301, 'my-profile')
    throw redirect(301, '/Signin')
  },
  createSubject: async ({ request }) => {
    const data = await request.formData()
    const color = data.get('color')?.toString()
    const name = data.get('name')?.toString()
    const owner = data.get('owner')?.toString()

    const newSubject = await prisma.subjects.create({
      data: {
        //@ts-ignore
        color,
        //@ts-ignore
        name,
        //@ts-ignore
        owner,
        workspaces: []
      }
    })
    if (!newSubject) return invalid(404, { message: 'Error creating subject, A database error', reason: 'databaseError' })
    const user = await prisma.users.update({
      where: {
        id: owner
      },
      data: {
        subjects: {
          push: newSubject.id
        }
      }
    })
    if (!user) return invalid(404, { message: 'Subject created but an error in database occured upon referencing to subject', reason: 'databaseError' })
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
  }
}