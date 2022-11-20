import prisma from "$lib/db";
import { error, redirect } from "@sveltejs/kit";
import { get } from "svelte/store";
import { global_PASS } from "$lib/stores/global.store";
import { compareSync } from "bcryptjs";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	if (!get(global_PASS)) throw redirect(303, '/Signin')

	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});
  
	if (!user) throw redirect(303, '/Signin');
	if (!compareSync(get(global_PASS), user.password)) throw error(401, 'Unauthorized accessing');

	const subjectConditions = user.favorites
		.filter((favorite) => favorite.for === 'subjects')[0]
		.ids.map((id) => {
			return { id };
		});
	const workspaceConditions = user.favorites
		.filter((favorite) => favorite.for === 'workspaces')[0]
		.ids.map((id) => {
			return { id };
		});
	const taskConditions = user.favorites
		.filter((favorite) => favorite.for === 'tasks')[0]
		.ids.map((id) => {
			return { id };
		});

	const subjects = await prisma.subjects.findMany({
		where: {
			OR: subjectConditions
		}
	});
	const workspaces = await prisma.workspaces.findMany({
		where: {
			OR: workspaceConditions
		}
	});
	const tasks = await prisma.tasks.findMany({
		where: {
			OR: taskConditions
		}
	});

	return { subjects, workspaces, tasks }
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