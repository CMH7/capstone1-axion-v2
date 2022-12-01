import prisma from '$lib/db';
import { global_PASS } from '$lib/stores/global.store';
import { error, redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import bcryptjs from 'bcryptjs'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  if (!get(global_PASS)) throw redirect(303, '/Signin');

	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});

	if (!user) throw error(404, 'Account not found');
	if (!bcryptjs.compareSync(get(global_PASS), user.password))
		throw error(401, 'Unauthorized access');

	const subject = await prisma.subjects.findFirst({
		where: {
			id: {
				equals: params.subjectID
			}
		}
	});

	if (!subject) throw error(404, 'Subject not found');

	const workspace = await prisma.workspaces.findFirst({
		where: {
			id: {
				equals: params.workspaceID
			}
		}
	});

  if (!workspace) throw error(404, 'Workspace cannot be found');
  
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
		global_PASS.set('');
		throw redirect(301, '/Signin');
	}
};