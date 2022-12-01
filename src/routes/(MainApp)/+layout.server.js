import prisma from '$lib/db';
import { global_PASS, global_USERID, loading } from '$lib/stores/global.store';
import { error, redirect } from '@sveltejs/kit';
import bcryptjs from 'bcryptjs';
import { get } from 'svelte/store';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params }) {
	loading.set(true)
	if (!get(global_PASS)) throw redirect(303, '/Signin')

	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});

	if (!user) throw error(404, 'Account not found')
	if (!bcryptjs.compareSync(get(global_PASS), user.password)) throw error(402, 'Unauthorized accessing')

	let notificationConditions = user.notifications.map(notifID => {return {id: notifID}})
	let invitationConditions = user.invitations.map(invID => {return {id: invID}})

	const notifications = await prisma.notifications.findMany({
		where: {
			OR: notificationConditions
		}
	})

	const invitations = await prisma.invitations.findMany({
		where: {
			OR: invitationConditions
		}
	})

	/**
	 * @type {{id: string}[]} 
	 * */
	let notifFromPicConditions = notifications.map(notif => {
		return {id: notif.for.userID}
	})

	let profiles = await prisma.users.findMany({
		where: {
			OR: notifFromPicConditions
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