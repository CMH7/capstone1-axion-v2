/* eslint-disable no-unused-vars */
import prisma from '$lib/db';
import { error, invalid, redirect } from '@sveltejs/kit'

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
	if (!subject) throw error(404, 'Subject not found');

	const workspace = await prisma.workspaces.findFirst({
		where: {
			id: {
				equals: params.workspaceID
			}
		}
	});
	if (!workspace) throw error(404, 'Workspace cannot be found');

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
  
	const otherUsers = await prisma.users.findMany({
		where: {
			OR: members.map(u => {return{NOT: {id: u.id}}})
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

	return { user, subject, workspace, members, otherUsers };
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
			},
			select: {
				id: true,
				name: true,
				members: true
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

		if (result.length == 0)
			return invalid(500, {
				message: 'Critical error in server, please reload',
				reason: 'databaseError'
			});

		const newNotification = await prisma.notifications.create({
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
				message: `${cUser.firstName} ${cUser.lastName} removed you as member in ${updatedWorkspace.name}`
			},
			select: {
				id: true
			}
		});

		const updatedRemovedMemberNotifs = await prisma.users.update({
			where: {
				id: userToRemove.id
			},
			data: {
				notifications: {
					push: newNotification.id
				}
			}
    });
    
    if(!updatedRemovedMemberNotifs) return invalid(404, {message: 'Failed to return data as updated', reason: 'databaseError'})

		//@ts-ignore
		let trs3 = [];

		updatedWorkspace.members.forEach((id) => {
			//@ts-ignore
			if (id !== userToRemove.id) {
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
								interf: '',
								subInterface: ''
							},
							fromTask: '',
							isRead: false,
							//@ts-ignore
							message: `${cUser.firstName} ${cUser.lastName} removed ${userToRemove.firstName} ${userToRemove.lastName} as member in ${updatedWorkspace.name}`
						}
					})
				];
			}
		});

		//@ts-ignore
		let secondBatchNotifications = await prisma.$transaction(trs3);

		//@ts-ignore
		let trs2 = [];
    updatedWorkspace.members.forEach((id, i) => {
      //@ts-ignore
			if (id !== userToRemove.id) {
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
			}
		});

		//@ts-ignore
		let updatedWorkspaceMembersNotifs = await prisma.$transaction(trs2);
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
			},
			select: {
        id: true,
        members: true
			}
		});

		if (!updatedWorkspace) return invalid(204, {message: 'Workspace is updated but did not return updated data please reload', reason: 'databaseError'});

		const newNotification = await prisma.notifications.create({
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
				message: `${cUser.firstName} ${cUser.lastName} demoted you as member in ${toUpdateWorkspace.name}`
			}
    });
    
		const updatedToRemoveAdmin = await prisma.users.update({
			where: {
				id: toRemoveAdmin.id
			},
			data: {
				notifications: {
					push: newNotification.id
				}
			}
    });
    
    if(!updatedToRemoveAdmin) return invalid(404, {message: 'Error in updating notifications of users', reason: 'databaseError'})

		//@ts-ignore
		let trs = [];

    updatedWorkspace.members.forEach((member) => {
      if (member !== toRemoveAdmin.id) {
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
                interf: '',
                subInterface: ''
              },
              fromTask: '',
              isRead: false,
              //@ts-ignore
              message: `${cUser.firstName} ${cUser.lastName} demoted ${toRemoveAdmin.firstName} ${toRemoveAdmin.lastName} as member in ${toUpdateWorkspace.name}`
            }
          })
        ];
      }
		});

		//@ts-ignore
    let secondBatchNotifications = await prisma.$transaction(trs);
    
		//@ts-ignore
    let trs2 = []
    updatedWorkspace.members.forEach((id, i) => {
      if (id !== toRemoveAdmin.id) { 
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
      }
		});

    //@ts-ignore
    let updatedWorkspaceMembersNotifs = await prisma.$transaction(trs2)
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

    if (!cUser) return invalid(404, { message: 'Account not found', reason: 'databaseError' })
    
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
      },
      select: {
        id: true,
        name: true,
        members: true
      }
    })

    if (!updatedWorkspace) return invalid(404, { message: 'Updated workspace did not return', reason: 'databaseError' })
    
    const newNotification = await prisma.notifications.create({
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
        message: `${cUser.firstName} ${cUser.lastName} promoted you as admin in ${workspace.name}`
      },
      select: {
        id: true
      }
    })

    if (!newNotification) return invalid(404, { message: 'Creating notification error please try again', reason: 'databaseError' })
    
    const updatedPromotedMember = await prisma.users.update({
      where: {
        id: memberID
      },
      data: {
        notifications: {
          push: newNotification.id
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    })

    if(!updatedPromotedMember) return invalid(404, {message: 'Updated member but failed to fetch data', reason: 'databaseError'})

    let members = updatedWorkspace.members.filter(id => id !== memberID)

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
							interf: '',
							subInterface: ''
						},
						fromTask: '',
						isRead: false,
						message: `${cUser.firstName} ${cUser.lastName} promoted ${updatedPromotedMember.firstName} ${updatedPromotedMember.lastName} as admin in ${updatedWorkspace.name}`
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
    members.forEach((id, i) => {
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
    })

    //@ts-ignore
    let secondBatchUpdateMembers = await prisma.$transaction(trs2)
  }
}