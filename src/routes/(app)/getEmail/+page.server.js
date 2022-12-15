import prisma from '$lib/db';
import { invalid } from '@sveltejs/kit';
import sgMail from '@sendgrid/mail'
import constants from '$lib/configs/constants';
import bcryptjs from 'bcryptjs'

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/** @type {import('./$types').Actions} */
export const actions = {
	resetPassword: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();

		const user = await prisma.users.findFirst({
			where: {
				email: {
					equals: email
				}
			},
			select: {
				id: true
			}
		});
		if (!user)
			return invalid(404, {
				message: 'Email is not linked to an account',
				reason: 'accountNotFoundViaEmail'
			});

		let code = '';

		for (let i = 0; i < 6; i++) {
			code += `${Math.ceil(Math.random() * 9)}`;
		}

		const mail = await sgMail.send(constants.resetPassMsg(email, code));
		if (!mail)
			return invalid(500, {
				message: 'Sending of email failed try again later',
				reason: 'databaseError'
			});

		code = bcryptjs.hashSync(code, 10);
		if (code === '') return invalid(500, { message: 'Error retrieving code please try again' });

		return { code };
	},
	resetPassword2: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString()
    let newPassword = data.get('newPassword')?.toString();

    const user1 = await prisma.users.findFirst({
      where: {
        email: {
          equals: email
        }
      },
      select: {
        id: true
      }
    })
    if(!user1) return invalid(404, {message: 'Failed to fetch email again. please try again', reason: 'serverError'})

    newPassword = bcryptjs.hashSync(newPassword, 10)
    
    const user = await prisma.users.update({
      where: {
        id: user1.id
      },
      data: {
        password: newPassword
      },
      select: {
        id: true
      }
    })
    if (!user) return invalid(404, { message: 'Failed to update password please contact the developers about retrieving your account', reason: 'serverError'})
	}
};
