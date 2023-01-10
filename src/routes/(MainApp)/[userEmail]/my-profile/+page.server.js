//@ts-nocheck
import { error, invalid, redirect } from '@sveltejs/kit'
import prisma from '$lib/db'
import uploadPic from '$lib/configs/helpers/uploadPic';
import { getDownloadURL } from 'firebase/storage'
import sgMail from '@sendgrid/mail'
import constants from '$lib/configs/constants';
import bcryptjs from 'bcryptjs'

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const user = await prisma.users.findFirst({
		where: {
			email: {
				equals: params.userEmail
			}
		}
	});
	if (!user) throw error(404, 'Account not found')
	
	let ownedWorkspacesCount = 0
	let ownedSubjectsCount = 0
	let joinedWorkspacesCount = 0
	let createdTasksCount = 0
	let assignedTasksCount = 0
	let favoriteSubjectsCounts = 0
	let favoriteWorkspacesCounts = 0
	let favoriteTasksCounts = 0

	if (user.showStatistics) {
		const ownedSubjects = await prisma.subjects.count({
			where: {
				owner: {
					equals: user.id
				}
			}
		});

		const ownedWorkspaces = await prisma.workspaces.count({
			where: {
				owner: {
					equals: user.id
				}
			}
		});

		const joinedWorkspaces = await prisma.workspaces.count({
			where: {
				members: {
					has: user.id
				},
				NOT: {
					owner: {
						equals: user.id
					}
				}
			}
		});

		const createdTasks = await prisma.tasks.count({
			where: {
				createdBy: {
					equals: user.id
				}
			}
		});

		const assignedTasks = await prisma.tasks.count({
			where: {
				members: {
					has: user.id
				}
			}
		});

		ownedSubjectsCount = ownedSubjects
		ownedWorkspacesCount = ownedWorkspaces
		joinedWorkspacesCount = joinedWorkspaces
		createdTasksCount = createdTasks
		assignedTasksCount = assignedTasks

		favoriteSubjectsCounts = user.favorites[0].ids.length
		favoriteWorkspacesCounts = user.favorites[1].ids.length
		favoriteTasksCounts = user.favorites[2].ids.length

		return {
			user,
			ownedSubjectsCount,
			ownedWorkspacesCount,
			joinedWorkspacesCount,
			createdTasksCount,
			assignedTasksCount,
			favoriteSubjectsCounts,
			favoriteWorkspacesCounts,
			favoriteTasksCounts
		};
	} else {
		return {
			user,
			ownedSubjectsCount,
			ownedWorkspacesCount,
			joinedWorkspacesCount,
			createdTasksCount,
			assignedTasksCount,
			favoriteSubjectsCounts,
			favoriteWorkspacesCounts,
			favoriteTasksCounts
		};
	}
}

/** @type {import('./$types').Actions} */
export const actions = {
	newPic: async ({ request }) => {
		const data = await request.formData();
		const rawData = data.get('rawData')?.toString();
		const userID = data.get('userID')?.toString();
		const fileName = data.get('fileName')?.toString();
		const fileType = data.get('fileType')?.toString();

		// @ts-ignore
		const { userRef, ups } = uploadPic(userID, rawData, fileName, { contentType: fileType });
		const upres = await ups;
		if (!upres) return invalid(500, { message: 'Server error file cannot be processed try again later', reason: 'databaseError' })
		
		const urla = await getDownloadURL(userRef);
		if(urla === '') return invalid(500, {message: 'Server file processing done but data was not fetch please reload', reason: 'databaseError'})

		const updatedUserProfile = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				profile: urla
			},
			select: {
				id: true
			}
		});

		if (!updatedUserProfile)
			return invalid(500, {
				message: 'Failed to update profile picture, please try again later',
				reason: 'databaseError'
			});
	},
	editBasicProfile: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const fname = data.get('firstName')?.toString();
		const lname = data.get('lastName')?.toString();
		//@ts-ignore
		const age = parseInt(data.get('age')?.toString());
		const gender = data.get('gender')?.toString();
		const school = data.get('school')?.toString();
		const course = data.get('course')?.toString();
		//@ts-ignore
		const year = parseInt(data.get('year')?.toString());
		const bio = data.get('bio')?.toString();

		const updatedUser = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				firstName: fname,
				lastName: lname,
				age,
				gender,
				school,
				course,
				year,
				bio
			},
			select: {
				id: true
			}
		});
		if (!updatedUser)
			return invalid(404, {
				message: 'Update user data failed please reload to try again.',
				reason: 'databaseError'
			});
	},
	changeEmail: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const newemail = data.get('newemail')?.toString();

		const exisiting = await prisma.users.findFirst({
			where: {
				email: {
					equals: newemail
				}
			},
			select: {
				id: true
			}
		});
		if (exisiting)
			return invalid(302, {
				message: 'Email is linked to another account, try another',
				reason: 'emailLinked'
			});

		let code = '';
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;

		const mail = await sgMail.send(constants.changeEmailMsg(email, code));

		if (!mail)
			return invalid(500, {
				message: `Failed to send update code to ${email}`,
				reason: 'databaseError'
			});

		code = bcryptjs.hashSync(code, 10);

		return { code };
	},
	changeEmailSecPhase: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const email = data.get('email')?.toString();

		const existingUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: email
				}
			},
			select: {
				id: true
			}
		});
		if (existingUser)
			return invalid(402, { message: 'Email is linked to another account', reason: 'emailLinked' });

		const updatedUser = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				email
			},
			select: {
				id: true
			}
		});
		if (!updatedUser) throw error(500, 'Accout not found please try again later');

		throw redirect(301, '/Signin');
	},
	changePassword: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();

		let code = '';
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;

		const mail = await sgMail.send(constants.resetPassMsg(email, code));

		if (!mail)
			return invalid(500, {
				message: `Failed to send reset code to ${email}`,
				reason: 'databaseError'
			});
		code = bcryptjs.hashSync(code, 10);

		return { code };
	},
	changePassSecPhase: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		let newPass = data.get('newPass')?.toString();

		//@ts-ignore
		newPass = bcryptjs.hashSync(newPass, 10);

		const updatedUser = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				password: newPass
			},
			select: {
				id: true
			}
		});
		if (!updatedUser) throw error(404, 'Account not found');

		throw redirect(302, '/Signin');
	},
	changeCanBeInvited: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const canBeInvited = data.get('canBeInvited')?.toString();

		const cbi = canBeInvited === 'off' ? false : true;

		const updatedUser = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				canBeInvited: cbi
			},
			select: {
				id: true
			}
		});
		if (!updatedUser)
			return invalid(404, {
				message: 'Updated but failed to fetch please reload.',
				reason: 'databaseError'
			});
	},
	changeShowTutorial: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const showTutorial = data.get('showTutorial')?.toString();

		const st = showTutorial === 'off' ? false : true;

		const updatedUser = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				showTutorial: st
			},
			select: {
				id: true
			}
		});
		if (!updatedUser)
			return invalid(404, {
				message: 'Updated but failed to fetch please reload.',
				reason: 'databaseError'
			});
	},
	changeShowStatistics: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const showStatistics = data.get('showStatistics')?.toString();

		const ss = showStatistics === 'off' ? false : true;

		const updatedUser = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				showStatistics: ss
			},
			select: {
				id: true
			}
		});
		if (!updatedUser)
			return invalid(404, {
				message: 'Updated but failed to fetch please reload.',
				reason: 'databaseError'
			});
	},
	changeFooterHints: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const footerHints = data.get('footerHints')?.toString();

		const fh = footerHints === 'off' ? false : true;

		const updatedUser = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				footerHints: fh
			},
			select: {
				id: true
			}
		});
		if (!updatedUser)
			return invalid(404, {
				message: 'Updated but failed to fetch please reload.',
				reason: 'databaseError'
			});
	},
	deleteAccountP1: async ({ request }) => {
		const data = await request.formData()
		const email = data.get('email')?.toString()

		let code = '';
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;
		code += `${Math.ceil(Math.random() * 9)}`;

		const mail = await sgMail.send(constants.deleteAccMsg(email, code));

		if (!mail)
			return invalid(500, {
				message: `Failed to send update code to ${email}`,
				reason: 'databaseError'
			});

		code = bcryptjs.hashSync(code, 10);

		return { code };
	},
	deleteAccountP2: async ({ request }) => {
		const data = await request.formData()
		const userID = data.get('id')?.toString()

		// get the current user
		const cUser = await prisma.users.findFirst({
			where: {
				id: {
					equals: userID
				}
			}
		})
		if(!cUser) throw error(404, 'Account not found')

		// get all created subjects
		const allCreatedSubjects = await prisma.subjects.findMany({
			where: {
				owner: {
					equals: userID
				}
			},
			select: {
				id: true
			}
		})

		// get all created workspaces
		const allCreatedWorkspaces = await prisma.workspaces.findMany({
			where: {
				owner: {
					equals: cUser.id
				}
			},
			select: {
				id: true
			}
		})

		// get all boards
		const allacwBoards = await prisma.boards.findMany({
			where: {
				OR: allCreatedWorkspaces.map(acw => {return{OR: acw.boards.map(id => {return{id}})}})
			},
			select: {
				id: true
			}
		})

		// get all tasks
		const allBoardsTasks = await prisma.tasks.findMany({
			where: {
				OR: allacwBoards.map(b => {
					return {
						status: {
							equals: b.id
						}
					}
				})
			}
		})

		// delete all chats
		const deleteTasksChats = prisma.chats.deleteMany({
			where: {
				OR: allBoardsTasks.map(t => {
					return {
						parentTask: {
							equals: t.id
						}
					}
				})
			}
		})

		// delete all tasks
		const deleteAllTasks = prisma.tasks.deleteMany({
			where: {
				OR: allBoardsTasks.map(abt=>{return{id:abt.id}})
			}
		})

		// delete all boards
		const deleteAllBoards = prisma.boards.deleteMany({
			where: {
				OR: allacwBoards.map(ab=>{return{id:ab.id}})
			}
		})

		// delete all workspaces
		const deleteAllWorkspaces = prisma.workspaces.deleteMany({
			where: {
				OR: allCreatedWorkspaces.map(acw=>{return{id:acw.id}})
			}
		})

		// delete all subjects
		const deleteAllSubjects = prisma.subjects.deleteMany({
			where: {
				OR: allCreatedSubjects.map(acs=>{return{id:acs.id}})
			}
		})
		
		// delete all logs that the commiter is the current user
		const deleteLogs = prisma.logs.deleteMany({
			where: {
				commiter: cUser.id
			}
		})

		// delete all invitation
		const deleteAllInvitations = prisma.invitations.deleteMany({
			where: {
				OR: [
					{
						from: {
							is: {
								id: {
									equals: cUser.id
								}
							}
						}
					},
					{
						to: {
							is: {
								id: {
									equals: cUser.id
								}
							}
						}
					}
				]
			}
		})

		const result2 = await prisma.$transaction([
			deleteTasksChats,
			deleteAllTasks,
			deleteAllBoards,
			deleteAllWorkspaces,
			deleteAllSubjects,
			deleteLogs,
			deleteAllInvitations
		]);
		if (!result2) throw error(500, 'Too much proccesses in result2');

		// CHECK ON OTHER DATA
		const deleteAllChatsSent = await prisma.chats.deleteMany({
			where: {
				sender: {
					equals: userID
				}
			}
		});
		if (!deleteAllChatsSent) throw error(500, 'Too much proccesses in result4');

		const deletedUser = await prisma.users.delete({
			where: {
				id: userID
			},
			select: {
				id: true
			}
		})
		if(!deletedUser) return invalid(500, {message: 'Failed to delete account.', reason: 'databaseError'})

		throw redirect(302, '/Signup')
	},
	resendVerification: async ({ params }) => {
		const user = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true
			}
		})
		if(!user) throw error(404, 'Account not found')

		const mail = await sgMail.send(constants.newMsg(
      user.email,
      `${user.firstName} ${user.lastName}`,
      `http://www.axion.social/verification/success/${user.id}`
		))
		if(!mail) return invalid(500, {message: 'Error sending verification mail please try again', reason: 'databaseError'})
	}
};