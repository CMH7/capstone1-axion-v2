import prisma from '$lib/db'
import { error } from '@sveltejs/kit'

export const prerender = true;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  let msg = 'Verified Successfully!'

  let user = await prisma.users.findFirst({
    where: {
      id: {
        equals: params.userID
      }
    },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      id: true,
      verified: true
    }
  })

  /**
   * @type {import('@prisma/client').users}
   */
  let user2

  if (!user) throw error(404, 'Account not found')
  if (user.verified) {
    msg = 'Already verified!'
  } else {
    user2 = await prisma.users.update({
      where: {
        id: user.id
      },
      data: {
        verified: {
          set: true
        }
      }
    })

    if (!user2) throw error(404, 'Account cannot be verified')
    
    if (user2.verified) user.verified = user2.verified
  }


  return {user, msg}
}