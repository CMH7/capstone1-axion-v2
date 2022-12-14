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

	const ownedSubjects = await prisma.subjects.findMany({
		where: {
			owner: {
				equals: user.id
			}
		},
		select: {
			id: true
		}
	})
	const ownedWorkspaces = await prisma.workspaces.findMany({
		where: {
			owner: {
				equals: user.id
			}
		},
		select: {
			id: true
		}
	})
	const joinedWorkspaces = await prisma.workspaces.findMany({
		where: {
			members: {
				has: user.id
			},
			NOT: {
				owner: {
					equals: user.id
				}
			}
		},
		select: {
			id: true
		}
	})
	const createdTasks = await prisma.tasks.findMany({
		where: {
			createdBy: {
				equals: user.id
			}
		},
		select: {
			id: true
		}
	})
	const assignedTasks = await prisma.tasks.findMany({
		where: {
			members: {
				has: user.id
			}
		},
		select: {
			id: true,
		}
	})

	const ownedWorkspacesCount = ownedWorkspaces.length
	const ownedSubjectsCount = ownedSubjects.length
	const joinedWorkspacesCount = joinedWorkspaces.length
	const createdTasksCount = createdTasks.length
	const assignedTasksCount = assignedTasks.length
	const favoriteSubjectsCounts = user.favorites[0].ids.length
	const favoriteWorkspacesCounts = user.favorites[1].ids.length
	const favoriteTasksCounts = user.favorites[2].ids.length
	
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

/** @type {import('./$types').Actions} */
export const actions = {
	logout: async ({ params }) => {
		const user = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			}
		});
		if (!user) throw error(404, 'Account not found');

		const user2 = await prisma.users.update({
			where: {
				id: user.id
			},
			data: {
				online: {
					set: false
				}
			}
		});
		if (!user2) throw redirect(301, 'my-profile');

		throw redirect(301, '/Signin');
	},
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

		const cUser = await prisma.users.findFirst({
			where: {
				id: {
					equals: userID
				}
			}
		})
		if(!cUser) throw error(404, 'Account not found')

		let trs1 = []
		let trs2 = []
		let trs3 = []
		let trs4 = []
		let trs5 = []
		let trs6 = []

		const allCreatedSubjects = await prisma.subjects.findMany({
			where: {
				owner: {
					equals: userID
				}
			}
		})

		const allCreatedWorkspaces = await prisma.workspaces.findMany({
			where: {
				OR: allCreatedSubjects.map(acs => {return{OR: acs.workspaces.map(id => {return{id}})}})
			}
		})

		const allacwBoards = await prisma.boards.findMany({
			where: {
				OR: allCreatedWorkspaces.map(acw => {return{OR: acw.boards.map(id => {return{id}})}})
			}
		})

		const allBoardsTasks = await prisma.tasks.findMany({
			where: {
				OR: allacwBoards.map(ab=>{return{OR:ab.tasks.map(id=>{return{id}})}})
			}
		})

		allCreatedWorkspaces.forEach(workspace => {
			workspace.members.forEach(m => {
				if (m !== userID) {
					trs1 = [
						...trs1,
						prisma.notifications.create({
							data: {
								aMention: false,
								anInvitation: false,
								conversationID: '',
								for: {
									self: true,
									userID: m
								},
								fromInterface: {
									interf: '',
									subInterface: ''
								},
								fromTask: '',
								isRead: false,
								message: `The owner deleted this workspace '${workspace.name}'`
							},
							select: {
								id: true
							}
						})
					]
				}
			})
		})

		const deleteTasksChats = prisma.chats.deleteMany({
			where: {
				OR: allBoardsTasks.map(abt=>{return{OR:abt.conversations.map(id=>{return{id}})}})
			}
		})
		const deleteAllTasks = prisma.tasks.deleteMany({
			where: {
				OR: allBoardsTasks.map(abt=>{return{id:abt.id}})
			}
		})
		const deleteAllBoards = prisma.boards.deleteMany({
			where: {
				OR: allacwBoards.map(ab=>{return{id:ab.id}})
			}
		})
		const deleteAllWorkspaces = prisma.workspaces.deleteMany({
			where: {
				OR: allCreatedWorkspaces.map(acw=>{return{id:acw.id}})
			}
		})
		const deleteAllSubjects = prisma.subjects.deleteMany({
			where: {
				OR: allCreatedSubjects.map(acs=>{return{id:acs.id}})
			}
		})
		const deleteAllNotifications = prisma.notifications.deleteMany({
			where: {
				OR: cUser.notifications.map(id => {return{id}})
			}
		})
		const deleteAllInvitations = prisma.invitations.deleteMany({
			where: {
				OR: cUser.invitations.map(id => {return{id}})
			}
		})
		
		const result1 = await prisma.$transaction(trs1)
		if (!result1) throw error(500, 'Too much proccesses in result1');

		const result2 = await prisma.$transaction([
			deleteTasksChats,
			deleteAllTasks,
			deleteAllBoards,
			deleteAllWorkspaces,
			deleteAllSubjects,
			deleteAllNotifications,
			deleteAllInvitations
		]);
		if (!result2) throw error(500, 'Too much proccesses in result2');

		let i = 0
		allCreatedWorkspaces.forEach(w => {
			w.members.forEach(m => {
				if (m !== userID) {
					trs2 = [
						...trs2,
						prisma.users.update({
							where: {
								id: m
							},
							data: {
								notifications: {
									push: result1[i].id
								}
							},
							select: {
								id: true
							}
						})
					]
					i++
				}
			})
		})

		const result2a = await prisma.$transaction(trs2)
		if(!result2a) throw error(500, 'Too much proccesses in result2a');

		// CHECK ON OTHER DATA
		const allSendedChats = await prisma.chats.findMany({
			where: {
				sender: {
					equals: userID
				}
			},
			select: {
				id: true
			}
		});

		const allTasksWithSendedChats = await prisma.tasks.findMany({
			where: {
				OR: allSendedChats.map((asc) => {
					return { conversations: { has: asc.id } };
				})
			}
		});

		allTasksWithSendedChats.forEach((task) => {
			let chats = task.conversations;
			let newmembers = task.members.filter((id) => id !== userID);
			let newviewers = task.viewers.filter((id) => id !== userID);
			let newsubs = task.subscribers.filter((id) => id !== userID);
			let newCreatedBy = task.members.filter((id) => id !== userID)[0];

			allSendedChats.forEach((chat) => {
				chats = chats.filter((ch) => ch !== chat.id);
			});

			trs3 = [
				...trs3,
				prisma.tasks.update({
					where: {
						id: task.id
					},
					data: {
						conversations: chats,
						members: newmembers,
						viewers: newviewers,
						subscribers: newsubs,
						createdBy: newCreatedBy
					},
					select: {
						id: true
					}
				})
			];
		});

		const result3 = await prisma.$transaction(trs3)
		if (!result3) throw error(500, 'Too much proccesses in result3')
		
		const deleteAllChatsSent = await prisma.chats.deleteMany({
			where: {
				sender: {
					equals: userID
				}
			}
		});
		if (!deleteAllChatsSent) throw error(500, 'Too much proccesses in result4');
		
		const allJoinedWorkspaces = await prisma.workspaces.findMany({
			where: {
				members: {
					has: userID
				}
			}
		})

		allJoinedWorkspaces.forEach(workspace => {
			let newmembers = workspace.members.filter(m => m !== userID)
			let newadmins = workspace.admins.filter(a => a !== userID)

			trs4 = [
				...trs4,
				prisma.workspaces.update({
					where: {
						id: workspace.id
					},
					data: {
						members: newmembers,
						admins: newadmins
					},
					select: {
						id: true
					}
				})
			]

			newmembers.forEach(nm => {
				trs5 = [
					...trs5,
					prisma.notifications.create({
						data: {
							aMention: false,
							anInvitation: false,
							conversationID: '',
							for: {
								self: true,
								userID: nm
							},
							fromInterface: {
								interf: '',
								subInterface: ''
							},
							fromTask: '',
							isRead: false,
							message: `${cUser.firstName} ${cUser.lastName} (${cUser.email}) leaved ${workspace.name}`
						},
						select: {
							id: true
						}
					})
				]
			})
		})

		const result5 = await prisma.$transaction(trs4)
		if (!result5) throw error(500, 'Too much proccesses in result5');
		
		const result6 = await prisma.$transaction(trs5)
		if (!result6) throw error(500, 'Too much proccesses in result5');

		let o = 0
		allJoinedWorkspaces.forEach(w => {
			w.members.forEach(m => {
				trs6 = [
					...trs6,
					prisma.users.update({
						where: {
							id: m
						},
						data: {
							notifications: {
								push: result6[o].id
							}
						},
						select: {
							id: true
						}
					})
				]
				o++
			})
		})

		const result7 = await prisma.$transaction(trs6)
		if (!result7) throw error(500, 'Too much proccesses in result7')

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
	}
};