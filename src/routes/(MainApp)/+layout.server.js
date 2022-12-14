import prisma from '$lib/db';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params }) {
	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});
	if (!user) throw error(404, 'Account not found')

	let notifications = await prisma.notifications.findMany({
		where: {
			OR: user.notifications.map(id => {return{id}})
		}
	})

	notifications = notifications.reverse()

	const invitations = await prisma.invitations.findMany({
		where: {
			OR: user.invitations.map(id => {return{id}})
		}
	})

	let profiles = await prisma.users.findMany({
		where: {
			OR: notifications.map(n => {return{id: n.for.userID}})
		},
		select: {
			id: true,
			profile: true
		}
	})

	/** 
	 * @type {{notifID: string, profile: string}[]} 
	 * */
	let notifFromPic = []

	notifications.map(notif => {
		profiles.map(profile => {
			if (notifFromPic.filter(nfp => nfp.notifID === notif.id).length == 0) {
				notifFromPic = [...notifFromPic, {notifID: notif.id, profile: profile.profile}]
			}
		})
	})

	return { user, notifications, invitations, notifFromPic };
}