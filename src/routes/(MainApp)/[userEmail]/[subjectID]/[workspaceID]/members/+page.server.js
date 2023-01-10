import prisma from '$lib/db';
import { error, redirect } from '@sveltejs/kit'

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
  
  let members = await prisma.users.findMany({
    where: {
      OR: workspace.members.map(id => {return{id}})
    },
    select: {
      firstName: true,
      lastName: true,
      gender: true,
      email: true,
      online: true,
      profile: true,
      id: true
    }
  })

  members = members.reverse()

  return {user, subject, workspace, members}
}