import prisma from '$lib/db';
import { global_PASS, global_USERID } from '$lib/stores/global.store';
import { redirect, error, invalid } from '@sveltejs/kit'
import bcryptjs from 'bcryptjs';
import { get } from 'svelte/store';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  if (!get(global_PASS)) throw redirect(303, '/Signin')
  
  const user = await prisma.users.findFirst({
    where: {
      email: {
        equals: params.userEmail
      }
    }
  })

  if (!user) throw redirect(303, '/Signin');

  global_USERID.set(user.id)
  if (!bcryptjs.compareSync(get(global_PASS), user.password)) throw error(402, 'Unauthorized accessing')

  let subjectConditions = user.subjects.map(subjectID => {
    return {
      id: subjectID
    }
  })

  const subjects = await prisma.subjects.findMany({
    where: {
      OR: subjectConditions
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
    global_PASS.set('')
    global_USERID.set('')
    throw redirect(301, '/Signin')
  },
  createSubject: async ({ request, params }) => {
    const data = await request.formData()
    const color = data.get('color')?.toString()
    const name = data.get('name')?.toString()
    const newSubject = await prisma.subjects.create({
      data: {
        //@ts-ignore
        color,
        //@ts-ignore
        name,
        owner: get(global_USERID),
        workspaces: []
      }
    })
    if (!newSubject) return invalid(404, { message: 'Error creating subject, A database error' })
    const user = await prisma.users.update({
      where: {
        id: get(global_USERID)
      },
      data: {
        subjects: {
          push: newSubject.id
        }
      }
    })
    if (!user) return invalid(404, { message: 'Subject created but an error in database occured upon referencing to subject' })
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

    if (!users) throw error(404, 'Some accounts not found, cannot delete this subject forever')
    
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

    let user = await prisma.users.findFirst({
      where: {
        id: {
          equals: get(global_USERID)
        }
      },
      select: {
        favorites: true
      }
    })

    user?.favorites.every(fav => {
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
				id: get(global_USERID)
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
  }
}