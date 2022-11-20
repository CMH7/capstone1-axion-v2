import prisma from "$lib/db";
import { global_PASS } from "$lib/stores/global.store";
import { error, redirect } from "@sveltejs/kit";
import { compareSync } from "bcryptjs";
import { get } from "svelte/store";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  if (!get(global_PASS)) {
		console.log('redirecting to signin');
		throw redirect(301, '/Signin');
	}

	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});

	if (user) {
    if (compareSync(get(global_PASS), user.password)) {
      const tasks = await prisma.tasks.findMany({
				where: {
					members: {
						has: user.id
					}
				}
			});

			if (tasks) return { tasks };
			throw error(404, 'No assigend tasks');
    } else {
      throw redirect(303, '/Signin');
    }
	} else {
		throw redirect(303, '/Signin');
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
    throw redirect(301, '/Signin')
  }
}