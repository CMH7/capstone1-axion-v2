import prisma from '$lib/db';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params }) {
	let user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});
	if (!user) throw error(404, 'Account not found')

	if (!user.online) {
		user = await prisma.users.update({
			where: {
				id: user.id
			},
			data: {
				online: true
			}
		})
		if (!user) throw error(404, 'Account not found');
	}

	const invitations = await prisma.invitations.findMany({
		where: {
			OR: [
				{
					from: {
						is: {
							id: {
								equals: user.id
							}
						}
					}
				},
				{
					to: {
						is: {
							id: {
								equals: user.id
							}
						}
					}
				}
			]
		}
	})

	return { user, invitations };
}