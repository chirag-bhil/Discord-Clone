import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@/lib/generated/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serverId: string; roleId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { name, color, icon, isGradient, isGlow, ...permissions } = await req.json();
    const { serverId, roleId } = await params;

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

    const role = await db.role.update({
      where: {
        id: roleId,
        serverId: serverId,
      },
      data: {
        name,
        color,
        icon,
        isGradient: Boolean(isGradient),
        isGlow: Boolean(isGlow),
        canManageServer: Boolean(permissions.canManageServer),
        canManageChannels: Boolean(permissions.canManageChannels),
        canManageRoles: Boolean(permissions.canManageRoles),
        canManageMessages: Boolean(permissions.canManageMessages),
        canKickMembers: Boolean(permissions.canKickMembers),
        canBanMembers: Boolean(permissions.canBanMembers),
        canCreateInvite: Boolean(permissions.canCreateInvite),
        canSendMessages: Boolean(permissions.canSendMessages),
        canAttachFiles: Boolean(permissions.canAttachFiles),
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.log("[ROLE_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ serverId: string; roleId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { serverId, roleId } = await params;

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

    const role = await db.role.delete({
      where: {
        id: roleId,
        serverId: serverId,
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.log("[ROLE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
