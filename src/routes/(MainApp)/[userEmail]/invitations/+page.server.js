import { error, invalid, redirect } from '@sveltejs/kit'
import prisma from '$lib/db'
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

	let invitations = await prisma.invitations.findMany({
		where: {
			OR: user.invitations.map(id => {return{id}})
		}
	})

	const toPics = await prisma.users.findMany({
		where: {
			OR: invitations.map(i => {return {id: i.to.id}})
		},
		select: {
			id: true,
			profile: true
		}
	})

	invitations = invitations.reverse()
  
  return { user, invitations, toPics };
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
	declineInvitation: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const invID = data.get('invID')?.toString();

		const cUser = await prisma.users.findFirst({
			where: {
				id: {
					equals: userID
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				profile: true
			}
		});
		if (!cUser) throw error(404, 'Account not found');

		const invitation = await prisma.invitations.findFirst({
			where: {
				id: {
					equals: invID
				}
			}
		});
		if (!invitation)
			return invalid(404, {
				message: 'Invitation was not found please reload',
				reason: 'databaseError'
			});

		const updatedInvitation = await prisma.invitations.update({
			where: {
				id: invID
			},
			data: {
				status: 'Declined',
				message: `${cUser.firstName} ${cUser.lastName} declined to join in ${invitation.workspace.name}`
			}
		});
		if (!updatedInvitation)
			return invalid(500, {
				message: 'Invitation decline has been stopped by the server please try again later',
				reason: 'databaseError'
			});

		const newNotification = await prisma.notifications.create({
			data: {
				aMention: false,
				anInvitation: false,
				conversationID: '',
				for: {
					self: true,
					userID
				},
				fromInterface: {
					interf: '',
					subInterface: ''
				},
				fromTask: '',
				isRead: false,
				message: `${cUser.firstName} ${cUser.lastName} declined to join in ${invitation.workspace.name}`
			},
			select: {
				id: true
			}
		});
		if (!newNotification)
			return invalid(404, { message: 'Error in generating notification', reason: 'databaseError' });

		const updatedUser = await prisma.users.update({
			where: {
				id: invitation.from.id
			},
			data: {
				notifications: {
					push: newNotification.id
				}
			},
			select: {
				id: true
			}
		});
		if (!updatedUser) throw error(500, 'Failed to update inviter, server error');
		pusherServer.trigger(invitation.from.id, 'updates', {})
	},
	cancelInvitation: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const invID = data.get('invID')?.toString();

		const cUser = await prisma.users.findFirst({
			where: {
				id: {
					equals: userID
				}
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				profile: true
			}
		});
		if (!cUser) throw error(404, 'Account not found');

		const invitation = await prisma.invitations.findFirst({
			where: {
				id: {
					equals: invID
				}
			}
		});
		if (!invitation)
			return invalid(404, {
				message: 'Invitation was not found please reload',
				reason: 'databaseError'
			});

		const updatedInvitation = await prisma.invitations.update({
			where: {
				id: invID
			},
			data: {
				status: 'Canceled',
				message: `${cUser.firstName} ${cUser.lastName} canceled the invitation on ${invitation.to.name} to join ${invitation.workspace.name}`
			}
		});
		if (!updatedInvitation)
			return invalid(500, {
				message: 'Invitation decline has been stopped by the server please try again later',
				reason: 'databaseError'
			});

		const newNotification = await prisma.notifications.create({
			data: {
				aMention: false,
				anInvitation: false,
				conversationID: '',
				for: {
					self: true,
					userID
				},
				fromInterface: {
					interf: '',
					subInterface: ''
				},
				fromTask: '',
				isRead: false,
				message: `${cUser.firstName} ${cUser.lastName} canceled the invitation on ${invitation.to.name} to join ${invitation.workspace.name}`
			},
			select: {
				id: true
			}
		});
		if (!newNotification)
			return invalid(404, { message: 'Error in generating notification', reason: 'databaseError' });

		const updatedUser = await prisma.users.update({
			where: {
				id: invitation.to.id
			},
			data: {
				notifications: {
					push: newNotification.id
				}
			},
			select: {
				id: true
			}
		});
		if (!updatedUser) throw error(500, 'Failed to update inviter, server error');
		pusherServer.trigger(invitation.to.id, 'updates', {});
	},
	removeInvitation: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const from = data.get('from')?.toString();
		const invitationID = data.get('invID')?.toString();

		const cUser = await prisma.users.findFirst({
			where: {
				id: {
					equals: userID
				}
			},
			select: {
				id: true,
				invitations: true
			}
		});
		if (!cUser) throw error(404, 'Account not found');

		const invitation = await prisma.invitations.findFirst({
			where: {
				id: {
					equals: invitationID
				}
			}
		});
		if (!invitation)
			return invalid(404, { message: 'Invitation was already deleted', reason: 'databaseError' });

		const otherUser = await prisma.users.findFirst({
			where: {
				id: {
					equals: from === 'yes' ? invitation.to.id : invitation.from.id
				}
			},
			select: {
				id: true,
				invitations: true
			}
		});
		if (!otherUser)
			return invalid(404, { message: 'Other user not found', reason: 'databaseError' });

		if (otherUser.invitations.includes(invitationID)) {
			const updatedUser = await prisma.users.update({
				where: {
					id: userID
				},
				data: {
					invitations: cUser.invitations.filter((id) => id !== invitationID)
				},
				select: {
					id: true
				}
			});
			if (!updatedUser)
				return invalid(500, {
					message: 'Failed to update user but invitation is deleted',
					reason: 'databaseError'
				});
		} else {
			const deletedInvitation = await prisma.invitations.delete({
				where: {
					id: invitationID
				},
				select: {
					id: true
				}
			});
			if (!deletedInvitation)
				return invalid(404, { message: 'Failed to delete invitation', reason: 'databaseError' });
		}
	},
	acceptInvitation: async ({ request }) => {
		const data = await request.formData()
		const userID = data.get('id')?.toString()
		const invID = data.get('invID')?.toString()

		const invitation = await prisma.invitations.findFirst({
			where: {
				id: {
					equals: invID
				}
			},
		})
		if (!invitation) return invalid(404, { message: 'invitation is not found please reload', reason: 'databaseError' })
		
		if(invitation.status === 'Canceled') return invalid(404, {message: 'Invitation is canceled already', reason: 'invitationCanceledErr'})

		const cUser = await prisma.users.update({
			where: {
				id: userID
			},
			data: {
				subjects: {
					push: invitation.subjectID
				}
			}
		})
		if (!cUser) throw error(404, 'Account not found')
		
		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: invitation.workspace.id
			},
			data: {
				members: {
					push: cUser.id
				}
			}
		})
		if (!updatedWorkspace) return invalid(404, { message: 'Workspace not found contact the owner about this', reason: 'workspaceNotFound' })
		
		const updatedInvitation = await prisma.invitations.update({
			where: {
				id: invitation.id
			},
			data: {
				status: 'Accepted',
				message: `${cUser.firstName} ${cUser.lastName} accepted ${invitation.from.name}'s invitation to join in ${invitation.workspace.name}`
			},
			select: {
				id: true
			}
		})
		if (!updatedInvitation) return invalid(404, { message: 'Updating the invitation failed', reason: 'databaseError' })

		let trs1 = []

		updatedWorkspace.members.filter(id => id !== cUser.id).forEach(m => {
			trs1 = [
				...trs1,
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
							interf: '',
							subInterface: ''
						},
						fromTask: '',
						isRead: false,
						message: `${cUser.firstName} ${cUser.lastName} accepted ${invitation.from.name}'s invitation to join in ${invitation.workspace.name}`
					},
					select: {
						id: true
					}
				})
			]
		})

		const result1 = await prisma.$transaction(trs1)
		if (!result1) return invalid(500, { message: 'An error occured upon generating notifications please reload', reason: 'databaseError' })
		
		let i = 0
		let trs2 = []

		updatedWorkspace.members.filter(id => id !== cUser.id).forEach(m => {
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
		})

		const result2 = await prisma.$transaction(trs2)
		if (!result2) return invalid(500, { message: 'An error occured upon notifying workspace members', reason: 'databaseError' })
		pusherServer.trigger(updatedWorkspace.members.filter(id => id !== cUser.id), 'updates', {})
	}
};
