//@ts-nocheck
import prisma from '$lib/db';
import { invalid, redirect } from '@sveltejs/kit';
import bcryptjs from 'bcryptjs'

/** @type {import('./$types').Actions} */
export const actions = {
  signin: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');
    const pass = data.get('password')
    const emailS = email?.toString()
    const passS = pass?.toString()

    const user = await prisma.users.findFirst({
      where: {
        email: {
          equals: emailS
        }
      }
    });

    if (!user) return invalid(404, {message: 'Email is not linked to any accounts', reason: 'noaccount'});
    if (!bcryptjs.compareSync(passS, user.password)) return invalid(401, { message: 'Password is incorrect', reason: 'credentials' });

    const user2 = await prisma.users.update({
      where: {
        id: user.id
      },
      data: {
        online: true
      }
    })
    if (!user2) return invalid(409, { message: 'Try again, server error', reason: 'other' });
    throw redirect(302, `/${emailS}`);
	}
};
