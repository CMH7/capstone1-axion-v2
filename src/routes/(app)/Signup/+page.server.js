//@ts-nocheck
import prisma from '$lib/db';
import { invalid, redirect } from '@sveltejs/kit';
import bcryptjs from 'bcryptjs'
import sgMail from '@sendgrid/mail'
import constants from '$lib/configs/constants';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/** @type {import('./$types').Actions} */
export const actions = {
  signup: async ({ request }) => {
    const data = await request.formData()
    const firstName = data.get('firstName')?.toString()
    const lastName = data.get('lastName')?.toString()
    const age = parseInt(data.get('age')?.toString())
    const gender = data.get('gender')?.toString()

    const school = data.get('school')?.toString()
    const course = data.get('course')?.toString()
    const year = parseInt(data.get('year')?.toString())

    const email = data.get('email')?.toString()
    const password = data.get('password')?.toString()
    const passCopy = await bcryptjs.hash(password?.toString(), 13)

    const existing = await prisma.users.findFirst({
      where: {
        email: {
          equals: email
        }
      },
      select: {
        id: true
      }
    })
    if (existing) return invalid(200, { message: 'Email used has an existing account' })

    const user = await prisma.users.create({
			data: {
				age,
				bio: '',
				course,
				email,
				favorites: [
					{ for: 'subjects', ids: [] },
					{ for: 'workspaces', ids: [] },
					{ for: 'tasks', ids: [] }
				],
				firstName: firstName,
				gender,
				lastName,
				password: passCopy,
				profile: '',
				school,
				showTutorial: true,
				verified: false,
				year,
        online: false,
        canBeInvited: true,
        footerHints: true,
        showStatistics: true
			}
		});
    if (!user) return invalid(500, { message: 'Database error. Please try again' })

    const mail = await sgMail.send(constants.newMsg(
      user.email,
      `${user.firstName} ${user.lastName}`,
      `https://axion-v2.herokuapp.com/verification/success/${user.id}`
    ))

    console.log(mail[0]);

    throw redirect(302, `/Signin`);
  }
}