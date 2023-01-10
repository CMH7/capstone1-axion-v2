import prisma from '$lib/db';
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const cUser = await prisma.users.findFirst({
    where: {
      email: {
        equals: params.userEmail
      }
    }
  })
  if (!cUser) throw redirect(303, '/Signin');

  let logs = await prisma.logs.findMany({
    where: {
      involve: {
        has: cUser.id
      }
    }
  })

  logs = logs.reverse()

  const commiters = await prisma.users.findMany({
    where: {
      OR: logs.map(l => {
        return {
          id: {
            equals: l.commiter
          }
        }
      })
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profile: true,
      online: true,
      gender: true,
      email: true,
      school: true,
      course: true,
      age: true,
      year: true
    }
  })

  return {cUser, logs, commiters}
}