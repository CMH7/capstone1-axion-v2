/* eslint-disable no-unused-vars */
import prisma from '$lib/db';
import { error, invalid, redirect } from '@sveltejs/kit'
import pusherServer from '$lib/configs/helpers/realtime.server';

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

	const subject = await prisma.subjects.findFirst({
		where: {
			id: {
				equals: params.subjectID
			}
		}
	});
	if (!subject) throw redirect(303, `/${user.email}`);
	
	const workspace = await prisma.workspaces.findFirst({
		where: {
			id: {
				equals: params.workspaceID
			}
		}
	});
	if (!workspace) throw redirect(303, `/${user.email}/${subject.id}`);

	if (!workspace.members.includes(user.id)) throw redirect(303, `/${user.email}/${subject.id}`);

	let members = await prisma.users.findMany({
		where: {
			OR: workspace.members.map((id) => {
				return { id };
			})
		},
		select: {
			firstName: true,
			lastName: true,
			gender: true,
			email: true,
			online: true,
			profile: true,
			id: true
		}
  });

	members = members.reverse()
	
	const invitations = await prisma.invitations.findMany({
		where: {
			OR: user.invitations.map(id=>{return{id}})
		}
	})
  
	const otherUsers = await prisma.users.findMany({
		where: {
			canBeInvited: true,
			verified: true,
			NOT: {
				OR: members.map(member => {return{id: member.id}})
			}
		},
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      online: true,
      profile: true,
      gender: true
    }
  })

	return { user, subject, workspace, members, otherUsers, invitations };
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
  removeMember: async ({ request, params }) => {
		const data = await request.formData();
		const memberID = data.get('id')?.toString();

		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});
		if (!cUser) return invalid(404, { message: 'Account not found please login', reason: 'databaseError' });

		let userToRemove = await prisma.users.findFirst({
			where: {
				id: {
					equals: memberID
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});
		if (!userToRemove) return invalid(404, { message: 'Member data not found on database', reason: 'noaccount' });

		const subject = await prisma.subjects.findFirst({
			where: {
				id: {
					equals: params.subjectID
				}
			},
			select: {
				id: true,
				workspaces: true
			}
		});
		if (!subject) return invalid(404, { message: { message: 'Subject not found', reason: 'nosubject' } });

		const toUpdateWorkspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				members: true,
				admins: true,
				boards: true,
				id: true
			}
		});
		if (!toUpdateWorkspace) return invalid(404, { message: 'Workspace not found', reason: 'noworkspace' });

		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: params.workspaceID
			},
			data: {
				members: toUpdateWorkspace.members.filter((id) => id !== memberID),
				admins: toUpdateWorkspace.admins.filter((id) => id !== memberID)
			}
		});
		if (!updatedWorkspace)
			return invalid(404, {
				message: 'Updated workspace cannot be found please reload',
				reason: 'updatingerror'
			});

		const allTaskID = await prisma.boards.findMany({
			where: {
				OR: toUpdateWorkspace.boards.map((id) => {return { id };})
			},
			select: {
				tasks: true
			}
		});

		let allToUpdatedTasks = await prisma.tasks.findMany({
			where: {
				OR: allTaskID.map(at => {return{OR: at.tasks.map(id => {return{id}})}})
			},
			select: {
				members: true,
				id: true
			}
		});
		//@ts-ignore
		let trs = [];
		allToUpdatedTasks.forEach((task) => {
			task.members = task.members.filter((id) => id !== memberID);
			//@ts-ignore
      trs = [
        //@ts-ignore
				...trs,
				prisma.tasks.update({
					where: {
						id: task.id
					},
					data: {
						members: task.members
					},
					select: {
						id: true,
						members: true
					}
				})
			];
		});
		//@ts-ignore
		const result = await prisma.$transaction(trs);

		//@ts-ignore
		let trs3 = [];
		toUpdateWorkspace.members.forEach((id) => {
			//@ts-ignore
			if (id !== cUser.id) {
				trs3 = [
					//@ts-ignore
					...trs3,
					prisma.notifications.create({
						data: {
							aMention: false,
							anInvitation: false,
							conversationID: '',
							for: {
								self: true,
								userID: cUser.id
							},
							fromInterface: {
								interf: subject.id,
								subInterface: updatedWorkspace.id
							},
							fromTask: '',
							isRead: false,
							//@ts-ignore
							message: `${cUser.firstName} ${cUser.lastName} removed ${id === memberID ? 'you' : `${userToRemove.firstName} ${userToRemove.lastName}`} as member in ${updatedWorkspace.name}`
						}
					})
				];
			}
		});
		//@ts-ignore
		let secondBatchNotifications = await prisma.$transaction(trs3);

		//@ts-ignore
		let trs2 = [];
		let i = 0
    toUpdateWorkspace.members.forEach((id) => {
			//@ts-ignore
			if (id !== cUser.id) {
				trs2 = [
					//@ts-ignore
					...trs2,
					prisma.users.update({
						where: {
							id
						},
						data: {
							notifications: {
								push: secondBatchNotifications[i].id
							}
						}
					})
				];
				i++;
			}
		});
		//@ts-ignore
		let updatedWorkspaceMembersNotifs = await prisma.$transaction(trs2);

		pusherServer.trigger(toUpdateWorkspace.members.filter(m => m !== cUser.id), 'updates', {})

		return {workspace: updatedWorkspace}
	},
  demoteAdmin: async ({ request, params }) => {
		const data = await request.formData();
		const adminID = data.get('id')?.toString();

		const cUser = await prisma.users.findFirst({
			where: {
				email: {
					equals: params.userEmail
				}
			},
			select: {
				firstName: true,
				lastName: true,
				id: true,
				profile: true
			}
		});
		if (!cUser) return invalid(404, {message: 'Current account is not found in database please login', reason: 'databaseError'});

		const toRemoveAdmin = await prisma.users.findFirst({
			where: {
				id: {
					equals: adminID
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		});

		if (!toRemoveAdmin) return invalid(404, {message: 'Admin data cannot be found please reload', reason: 'databaseError'});

		let toUpdateWorkspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				admins: true,
				name: true,
				members: true
			}
		});

		if (!toUpdateWorkspace) return invalid(404, {message: 'Workspace data cannot be found please reload', reason: 'databaseError'});

		toUpdateWorkspace.admins = toUpdateWorkspace.admins.filter((id) => id !== adminID);

		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: toUpdateWorkspace.id
			},
			data: {
				admins: toUpdateWorkspace.admins
			}
		});
		if (!updatedWorkspace) return invalid(204, {message: 'Workspace is updated but did not return updated data please reload', reason: 'databaseError'});

		if (updatedWorkspace.members.length > 1) {
			const subject = await prisma.subjects.findFirst({
				where: {
					workspaces: {
						has: updatedWorkspace.id
					}
				}
			})
			if(!subject) return invalid(404, {message: 'Subject not found', reason: 'databaseError'})
			//@ts-ignore
			let trs = [];
			updatedWorkspace.members.forEach((member) => {
				if (member !== cUser.id) {
					trs = [
						//@ts-ignore
						...trs,
						prisma.notifications.create({
							data: {
								aMention: false,
								anInvitation: false,
								conversationID: '',
								for: {
									self: true,
									userID: cUser.id
								},
								fromInterface: {
									interf: subject.id,
									subInterface: updatedWorkspace.id
								},
								fromTask: '',
								isRead: false,
								//@ts-ignore
								message: `${cUser.firstName} ${cUser.lastName} demoted ${toRemoveAdmin.id === member ? 'you' : `${toRemoveAdmin.firstName} ${toRemoveAdmin.lastName}`} as member in ${toUpdateWorkspace.name}`
							},
							select: {
								id: true
							}
						})
					];
				}
			});
			//@ts-ignore
			let secondBatchNotifications = await prisma.$transaction(trs);
	
			//@ts-ignore
			let trs2 = []
			let i = 0
			updatedWorkspace.members.forEach((id) => {
				if (id !== cUser.id) { 
					trs2 = [
						//@ts-ignore
						...trs2,
						prisma.users.update({
							where: {
								id
							},
							data: {
								notifications: {
									push: secondBatchNotifications[i].id
								}
							}
						})
					]
					i++
				}
			});
			//@ts-ignore
			let updatedWorkspaceMembersNotifs = await prisma.$transaction(trs2)
			if (!updatedWorkspaceMembersNotifs)
				return invalid(500, { message: 'Failed to generate notifications', reason: 'databaseError' })
			
			pusherServer.trigger(updatedWorkspace.members.filter(m => m !== cUser.id), 'updates', {})
		}

		return {workspace: updatedWorkspace}
  },
  promoteMember: async ({ request, params }) => {
    const data = await request.formData()
    const memberID = data.get('id')?.toString()

    const cUser = await prisma.users.findFirst({
      where: {
        email: {
          equals: params.userEmail
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    })
    if (!cUser) throw error(404, 'Account not found')
    
    const subject = await prisma.subjects.findFirst({
      where: {
        id: {
          equals: params.subjectID
        }
      },
      select: {
        id: true
      }
    })
    if (!subject) return invalid(404, { message: 'Subject not found', reason: 'databaseError' })
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        id: {
          equals: params.workspaceID
        }
      },
      select: {
        id: true,
        name: true
      }
    })
    if (!workspace) return invalid(404, { message: 'Workspace not found', reason: 'databaseError' })
    
    const updatedWorkspace = await prisma.workspaces.update({
      where: {
        id: workspace.id
      },
      data: {
        admins: {
          push: memberID
        }
      }
    })
		if (!updatedWorkspace) return invalid(404, { message: 'Updated workspace did not return', reason: 'databaseError' })
		
		const toUpdatePromotedMember = await prisma.users.findFirst({
			where: {
				id: {
					equals: memberID
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true
			}
		})
		if(!toUpdatePromotedMember) return invalid(404, {message: 'Promoting an unknown user please try again later', reason: 'databaseError'})


		if (updatedWorkspace.members.length > 1) {
			const subject = await prisma.subjects.findFirst({
				where: {
					workspaces: {
						has: updatedWorkspace.id
					}
				},
				select: {
					id: true
				}
			})
			if(!subject) return invalid(404, {message: 'Subject not found', reason: 'databaseError'})

			let members = updatedWorkspace.members.filter(id => id !== cUser.id)
	
			//@ts-ignore
			let trs = []
			members.forEach(id => {
				trs = [
					//@ts-ignore
					...trs,
					prisma.notifications.create({
						data: {
							aMention: false,
							anInvitation: false,
							conversationID: '',
							for: {
								self: true,
								userID: cUser.id
							},
							fromInterface: {
								interf: subject.id,
								subInterface: updatedWorkspace.id
							},
							fromTask: '',
							isRead: false,
							message: `${cUser.firstName} ${cUser.lastName} promoted ${toUpdatePromotedMember.id === id ? 'you' : `${toUpdatePromotedMember.firstName} ${toUpdatePromotedMember.lastName}`} as admin in ${updatedWorkspace.name}`
						},
						select: {
							id: true
						}
					})
				];
			})
	
			//@ts-ignore
			let secondBatchNotifications = await prisma.$transaction(trs)
	
			//@ts-ignore
			let trs2 = []
			let i = 0
			members.forEach((id) => {
				trs2 = [
					//@ts-ignore
					...trs2,
					prisma.users.update({
						where: {
							id
						},
						data: {
							notifications: {
								push: secondBatchNotifications[i].id
							}
						}
					})
				]
				i++
			})
	
			//@ts-ignore
			let secondBatchUpdateMembers = await prisma.$transaction(trs2)
			
			pusherServer.trigger(updatedWorkspace.members.filter(m => m !== cUser.id), 'updates', {})
		}
		
		return {workspace: updatedWorkspace}
	},
	inviteUser: async ({ request, params }) => {
		const data = await request.formData()
		const invitedUserID = data.get('iuID')?.toString()
		const invitedUserName = data.get('iuName')?.toString()

		const cUser = await prisma.users.findFirst({
			where: {
				email: params.userEmail
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				profile: true,
				email: true
			}
		})
		if (!cUser) throw error(404, 'Account not found')
		
		const workspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			},
			select: {
				id: true,
				name: true
			}
		})
		if(!workspace) return invalid(404, {message: 'Error looking for workspace please reload.', reason: 'databaseError'})

		const newInvitation = await prisma.invitations.create({
			data: {
				from: {
					email: cUser.email,
					id: cUser.id,
					name: `${cUser.firstName} ${cUser.lastName}`,
					profile: cUser.profile
				},
				message: `${cUser.firstName} ${cUser.lastName} invites ${invitedUserName} to their workspace ${workspace.name}`,
				status: 'Pending',
				subjectID: params.subjectID,
				to: {
					id: invitedUserID,
					name: invitedUserName
				},
				workspace: {
					id: params.workspaceID,
					name: workspace.name
				}
			},
			select: {
				id: true
			}
		});
		if (!newInvitation) return invalid(404, { message: 'Inviting process failed.', reason: 'databaseError' })

		const newNotification = await prisma.notifications.create({
			data: {
				aMention: false,
				anInvitation: true,
				conversationID: '',
				for: {
					self: true,
					userID: cUser.id
				},
				fromInterface: {
					interf: '',
					subInterface: ''
				},
				fromTask: '',
				isRead: false,
				message: `${cUser.firstName} ${cUser.lastName} invites ${invitedUserName} to their workspace ${workspace.name}`
			},
			select: {
				id: true
			}
		});
		if(!newNotification) return invalid(500, {message: 'Error generating notification', reason: 'databaseError'})
		
		const updatedUser1 = await prisma.users.update({
			where: {
				id: cUser.id
			},
			data: {
				invitations: {
					push: newInvitation.id
				}
			},
			select: {
				id: true
			}
		})
		if (!updatedUser1) return invalid(500, { message: 'Invitation proccess stopped by server, please reload', reason: 'databaseError' })
		
		const updatedUser2 = await prisma.users.update({
			where: {
				id: invitedUserID
			},
			data: {
				invitations: {
					push: newInvitation.id
				},
				notifications: {
					push: newNotification.id
				}
			}
		})
		if (!updatedUser2) return invalid(500, { message: 'Invitation proccess stopped by server, please reload', reason: 'databaseError' })
		
		pusherServer.trigger(invitedUserID, 'updates', {})
	}
}