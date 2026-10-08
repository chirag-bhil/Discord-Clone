import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@/lib/generated/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { name, color, icon, isGradient, isGlow, ...permissions } = await req.json();
    const { serverId } = await params;

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!name) {
      return new NextResponse("Name missing", { status: 400 });
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

    const role = await db.role.create({
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
        serverId: serverId,
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.log("[ROLES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { serverId } = await params;

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    const roles = await db.role.findMany({
      where: {
        serverId: serverId,
      },
      orderBy: {
        createdAt: "asc",
      }
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.log("[ROLES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
