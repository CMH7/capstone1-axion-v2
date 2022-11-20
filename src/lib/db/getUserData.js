import prisma from ".";
import { error } from "@sveltejs/kit";
import { get } from "svelte/store";
import { userData } from "$lib/stores/user.store";

export default async (/** @type string*/ userEmail) => {
  if (get(userData).id === '') {
    try {
			const user = await prisma.users.findFirst({
				where: {
					email: {
						equals: userEmail
					}
				}
			});

			if (user) userData.set(user);

			throw error(404, 'Account not found');
    } catch (e) {
      //@ts-ignore
			throw error(e.status, `${e.body.message} in getUserData`);
		}
  }
}