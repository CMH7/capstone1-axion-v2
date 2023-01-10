import { error, invalid } from '@sveltejs/kit'
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

	invitations = invitations.reverse()
  
  return { user, invitations };
}

/** @type {import('./$types').Actions} */
export const actions = {
	declineInvitation: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const invID = data.get('invID')?.toString();

		// get current user
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

		// check for the invitation existence
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

		// update the invitation status to declined
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
		
		// create log error
		const newlog = await prisma.logs.create({
			data: {
				commiter: cUser.id,
				log: `declined to join in ${invitation.workspace.name}`,
				logDate: new Date(),
				type: 'invitation',
				involve: [invitation.from.id, invitation.to.id]
			}
		})
		if (!newlog) return invalid(500, { messagge: 'Failed to log the process please try again later', reason: 'databaseError' })
		
		pusherServer.trigger(invitation.from.id, 'updates', {})
	},
	cancelInvitation: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const invID = data.get('invID')?.toString();

		// delete the invitation
		const deletedInvitation = await prisma.invitations.delete({
			where: {
				id: invID
			}
		});
		if (!deletedInvitation)
			return invalid(500, {
				message: 'Invitation decline has been stopped by the server please try again later',
				reason: 'databaseError'
			});

		// create a log
		const newlog = await prisma.logs.create({
			data: {
				//@ts-ignore
				commiter: userID,
				log: `canceled invitation for ${deletedInvitation.to.name} to join in the workspace ${deletedInvitation.workspace.name}`,
				logDate: new Date(),
				type: 'invitation',
				involve: [deletedInvitation.from.id, deletedInvitation.to.id]
			}
		});
		if(!newlog) return invalid(500, {message: 'Failed to log the process please try again later', reason: 'databaseError'})

		pusherServer.trigger(deletedInvitation.to.id, 'updates', {});
	},
	removeInvitation: async ({ request }) => {
		const data = await request.formData();
		const userID = data.get('id')?.toString();
		const invitationID = data.get('invID')?.toString();

		// get current user
		const cUser = await prisma.users.findFirst({
			where: {
				id: {
					equals: userID
				}
			},
			select: {
				id: true
			}
		});
		if (!cUser) throw error(404, 'Account not found');
		
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
	},
	acceptInvitation: async ({ request }) => {
		const data = await request.formData()
		const userID = data.get('id')?.toString()
		const invID = data.get('invID')?.toString()

		// validate invitation
		const invitation = await prisma.invitations.findFirst({
			where: {
				id: {
					equals: invID
				}
			},
		})
		if (!invitation) return invalid(404, { message: 'invitation is not found please reload', reason: 'databaseError' })
		
		// check if canceled invitation
		if(invitation.status === 'Canceled') return invalid(404, {message: 'Invitation is canceled already', reason: 'invitationCanceledErr'})
		
		// add the current user to the workspace as member
		const updatedWorkspace = await prisma.workspaces.update({
			where: {
				id: invitation.workspace.id
			},
			data: {
				members: {
					push: userID
				}
			}
		})
		if (!updatedWorkspace) return invalid(404, { message: 'Workspace not found contact the owner about this', reason: 'workspaceNotFound' })
		
		// add the current user to the member of the subject
		const subject = await prisma.subjects.update({
			where: {
				id: updatedWorkspace.parentSubject
			},
			data: {
				members: {
					push: userID
				}
			}
		})
		if(!subject) return invalid(404, {message: 'Subject not found, failed to update', reason: 'databaseError'})

		// update the invitation status to Accepted
		const updatedInvitation = await prisma.invitations.update({
			where: {
				id: invitation.id
			},
			data: {
				status: 'Accepted',
				message: `${invitation.to.name} accepted ${invitation.from.name}'s invitation to join in ${invitation.workspace.name}`
			}
		})
		if (!updatedInvitation) return invalid(404, { message: 'Updating the invitation failed', reason: 'databaseError' })

		// create a log
		const newlog = await prisma.logs.create({
			data: {
				//@ts-ignore
				commiter: userID,
				log: updatedInvitation.message,
				logDate: new Date(),
				type: 'invitation',
				involve: updatedWorkspace.members
			}
		})
		if (!newlog) return invalid(500, { message: 'Failed to log the process please try again later', reason: 'databaseError' })
		
		pusherServer.trigger(updatedWorkspace.members.filter(id => id !== userID), 'updates', {})
	}
};
