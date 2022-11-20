import prisma from '$lib/db';
import { global_PASS, loading } from '$lib/stores/global.store';
import { redirect } from '@sveltejs/kit';
import { compareSync } from 'bcryptjs';
import { get } from 'svelte/store';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params }) {
	loading.set(true)
	if (!get(global_PASS)) {
		throw redirect(303, '/Signin');
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
			let notificationConditions = user.notifications.length != 0 ? user.notifications.map(notifID => {
				return {id: notifID}
			}) : []

			let invitationConditions = user.invitations.length != 0 ? user.invitations.map(invID => {
				return {id: invID}
			}) : []

			const notifications = notificationConditions.length != 0 ? await prisma.notifications.findMany({
				where: {
					OR: notificationConditions
				}
			}) : []

			const invitations = invitationConditions.length != 0 ? await prisma.invitations.findMany({
				where: {
					OR: invitationConditions
				}
			}) : []

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
	}

	throw redirect(303, '/Signin');
}