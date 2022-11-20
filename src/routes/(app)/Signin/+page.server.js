import validators from '$lib/configs/validators';
import prisma from '$lib/db';
import { global_PASS, notifs } from '$lib/stores/global.store';
import { error, invalid, redirect } from '@sveltejs/kit';
import { compareSync } from 'bcryptjs';
import { get } from 'svelte/store'

/** @type {import('./$types').Actions} */
export const actions = {
  signin: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');
    const pass = data.get('password')
    const emailS = email?.toString()
    const passS = pass?.toString()
    if (!emailS || !passS) return invalid(400, { message: `${!emailS && !passS ? 'Email and password' : !emailS && passS ? 'Email' : 'Password'} is empty` })
    if(!validators.isEmailValid(emailS)) return invalid(400, { message: 'Email is not valid' });
    //@ts-ignore
    global_PASS.set(pass.toString())

    const user = await prisma.users.findFirst({
      where: {
        AND: {
          email: {
            equals: emailS
          }
        }
      }
    });

    if (!user) return invalid(404, {message: 'Email is not linked to any accounts'});
    if (!compareSync(passS, user.password)) return invalid(401, { message: 'Password is incorrect' });

    const user2 = await prisma.users.update({
      where: {
        id: user.id
      },
      data: {
        online: {
          set: true
        }
      }
    })
    if(!user2) return invalid(409, { message: 'Try again, server error' });

    throw redirect(302, `/${emailS}`);

	}
};
