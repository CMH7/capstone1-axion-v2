import prisma from '$lib/db'
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
			OR: [
				{
					from: {
						is: {
							id: {
								equals: user.id
							}
						}
					}
				},
				{
					to: {
						is: {
							id: {
								equals: user.id
							}
						}
					}
				}
			]
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
  removeMember: async ({ request, params }) => {
		const data = await request.formData();
		const memberID = data.get('id')?.toString();

		// get the current user
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
		if (!cUser) return invalid(404, { message: 'Account not found please relogin', reason: 'databaseError' });

		// get the user to be remove
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

		// get the workspace before update of members list
		const toUpdateWorkspace = await prisma.workspaces.findFirst({
			where: {
				id: {
					equals: params.workspaceID
				}
			}
		});
		if (!toUpdateWorkspace) return invalid(404, { message: 'Workspace not found', reason: 'noworkspace' });

		// update the workspace members and admins list
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

		// get all task that the member to be remove is part of
		let allToUpdatedTasks = await prisma.tasks.findMany({
			where: {
				OR: [
					{
						members: {
							has: memberID
						}
					}
				]
			},
			select: {
				members: true,
				id: true
			}
		});

		//@ts-ignore
		let trs = [];

		// query the removing of the member to all task as the member of the task
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
		await prisma.$transaction(trs);

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `removed ${userToRemove.firstName} ${userToRemove.lastName} as a member of workspace ${updatedWorkspace.name}`,
				logDate: new Date(),
				type: 'member',
				involve: updatedWorkspace.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again', reason: 'databaseError'})

		if (updatedWorkspace.members.length > 1) {
			pusherServer.trigger(toUpdateWorkspace.members.filter(m => m !== cUser.id), 'updates', {})
		}

		return {workspace: updatedWorkspace}
	},
  demoteAdmin: async ({ request, params }) => {
		const data = await request.formData();
		const adminID = data.get('id')?.toString();

		// get the current user
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

		// get the user to be demoted
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

		// get the workspace before the updates
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

		// update the admins list of the workspace
		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: toUpdateWorkspace.id
			},
			data: {
				admins: toUpdateWorkspace.admins.filter((id) => id !== adminID)
			}
		});
		if (!updatedWorkspace) return invalid(204, {message: 'Workspace is updated but did not return updated data please reload', reason: 'databaseError'});

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `removed ${toRemoveAdmin.firstName} ${toRemoveAdmin.lastName} as admin in workspace ${updatedWorkspace.name}`,
				logDate: new Date(),
				type: 'member',
				involve: updatedWorkspace.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})

		if (updatedWorkspace.members.length > 1) {			
			pusherServer.trigger(updatedWorkspace.members.filter(m => m !== cUser.id), 'updates', {})
		}

		return {workspace: updatedWorkspace}
  },
  promoteMember: async ({ request, params }) => {
    const data = await request.formData()
    const memberID = data.get('id')?.toString()

		// get the current user
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
		
		// get the promoted member
		const promotedMember = await prisma.users.findFirst({
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
		if(!promotedMember) return invalid(404, {message: 'Member is not found please try again later', reason: 'databaseError'})
    
		// get the workspace before updates
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
    
		// update the workspace's admins list
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

		// create a log for all workspace members
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `promoted ${promotedMember.firstName} ${promotedMember.lastName} as an admin in the workspace ${updatedWorkspace.name}`,
				logDate: new Date(),
				type: "member",
				involve: updatedWorkspace.members
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})

		if (updatedWorkspace.members.length > 1) {
			pusherServer.trigger(updatedWorkspace.members.filter(m => m !== cUser.id), 'updates', {})
		}
		
		return {workspace: updatedWorkspace}
	},
	inviteUser: async ({ request, params }) => {
		const data = await request.formData()
		const invitedUserID = data.get('iuID')?.toString()
		const invitedUserName = data.get('iuName')?.toString()
		const invitedUserProfile = data.get('iuProfile')?.toString()

		// get the current user
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
		
		// get the workspace
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

		// create new invitation
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
				//@ts-ignore
				to: {
					id: invitedUserID,
					name: invitedUserName,
					profile: invitedUserProfile
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
		
		// create a log for both parties
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `invited ${invitedUserName}(${invitedUserID}) to join in workspace ${workspace.name}`,
				logDate: new Date(),
				type: 'invitation',
				//@ts-ignore
				involve: [cUser.id, invitedUserID]
			}
		})
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})

		//@ts-ignore
		pusherServer.trigger(invitedUserID, 'updates', {})
	}
}