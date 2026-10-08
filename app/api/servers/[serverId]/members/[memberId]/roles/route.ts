import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@/lib/generated/prisma";
import { ServerWithMembersRoles } from "@/types";

// Map MongoDB explicit MemberRoleLink result back to frontend-consumable shape.
const withRoles = (server: ServerWithMembersRoles | null) => {
    if (!server) return server;
    return {
        ...server,
        members: server.members.map((m) => ({
            ...m,
            roles: m.memberRoles.map((mr) => mr.role),
        })),
    };
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ serverId: string; memberId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { roleId } = await req.json();
    const { serverId, memberId } = await params;

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const server = await db.server.findUnique({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: MemberRole.ADMIN,
          }
        }
      }
    });

    if (!server) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const member = await db.member.update({
      where: {
        id: memberId,
        serverId: serverId,
      },
      data: {
        memberRoles: {
          create: {
            roleId
          }
        }
      },
      include: {
        profile: true,
        memberRoles: { include: { role: true } },
      }
    });

    const serverWithMembers = await db.server.findUnique({
        where: {
            id: serverId,
        },
        include: {
            members: {
                include: {
                    profile: true,
                    memberRoles: { include: { role: true } },
                },
                orderBy: {
                    role: "asc",
                }
            }
        }
    });

    return NextResponse.json(withRoles(serverWithMembers));
  } catch (error) {
    console.log("[MEMBER_ROLE_ADD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ serverId: string; memberId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { roleId } = await req.json();
    const { serverId, memberId } = await params;

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const server = await db.server.findUnique({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: MemberRole.ADMIN,
          }
        }
      }
    });

    if (!server) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const member = await db.member.update({
      where: {
        id: memberId,
        serverId: serverId,
      },
      data: {
        memberRoles: {
          deleteMany: { roleId }
        }
      },
      include: {
        profile: true,
        memberRoles: { include: { role: true } },
      }
    });

    const serverWithMembers = await db.server.findUnique({
        where: {
            id: serverId,
        },
        include: {
            members: {
                include: {
                    profile: true,
                    memberRoles: { include: { role: true } },
                },
                orderBy: {
                    role: "asc",
                }
            }
        }
    });

    return NextResponse.json(withRoles(serverWithMembers));
  } catch (error) {
    console.log("[MEMBER_ROLE_REMOVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}