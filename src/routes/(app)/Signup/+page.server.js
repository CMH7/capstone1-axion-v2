//@ts-nocheck
import prisma from '$lib/db';
import { invalid, redirect } from '@sveltejs/kit';
import bcryptjs from 'bcryptjs'
import * as sgMail from '@sendgrid/mail'
import constants from '$lib/configs/constants';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/** @type {import('./$types').Actions} */
export const actions = {
  signup: async ({ request }) => {
    const data = await request.formData()
    const firstName = data.get('firstName')
    const lastName = data.get('lastName')
    const age = parseInt(data.get('age')?.toString())
    const gender = data.get('gender')

    const school = data.get('school')
    const course = data.get('course')
    const year = parseInt(data.get('year')?.toString())

    const email = data.get('email')
    const password = data.get('password')
    const passCopy = await bcryptjs.hash(password?.toString(), 13)

    const existing = await prisma.users.findFirst({
      where: {
        email: {
          equals: email?.toString()
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
				course: course?.toString(),
				email: email?.toString(),
				favorites: [
					{ for: 'subjects', ids: [] },
					{ for: 'workspaces', ids: [] },
					{ for: 'tasks', ids: [] }
				],
				firstName: firstName?.toString(),
				gender: gender?.toString(),
				invitations: [],
				lastName: lastName?.toString(),
				notifications: [],
				password: passCopy,
				profile: '',
				school: school?.toString(),
				showTutorial: true,
				subjects: [],
				verified: false,
				year,
        online: false,
        canBeInvited: true,
        footerHints: true,
        showStatistics: true
			}
		});
    if (!user) return invalid(500, { message: 'Database error. Please try again' })

    sgMail.send(constants.newMsg(
      user.email,
      `${user.firstName} ${user.lastName}`,
      `https://axion-v2.herokuapp.com/verification/success/${user.id}`
    )).then((res) => {
      console.log(`Email verification sent to ${user.email}, ${res}`);
    }).catch((err) => {
      console.error(err);
    });

    throw redirect(302, `/Signin`);
  }
}