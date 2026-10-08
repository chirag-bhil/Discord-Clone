import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ServerWithMembersRoles } from "@/types";
import { NextResponse } from "next/server";

// Reshape MongoDB explicit MemberRoleLink back to `member.roles: Role[]`.
function mapServer(server: ServerWithMembersRoles | null) {
    if (!server) return server;
    return {
        ...server,
        members: server.members.map((m) => ({
            ...m,
            roles: m.memberRoles.map((mr) => mr.role),
        })),
    };
}

export async function DELETE(
    req: Request,
    { params } : { params: Promise<{ memberId: string }> }
){
    try {
        const profile = await currentProfile();
        const { searchParams } = new URL(req.url);
        const serverId = searchParams.get("serverId");
        const { memberId } = await params;

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!serverId){
            return new NextResponse("Server ID is required", { status: 400 });
        }

        if (!memberId){
            return new NextResponse("Member ID is required", { status: 400 });
        }

        const server =  await db.server.update({
            where: {
                id: serverId,
                profileId: profile.id,
            },
            data: {
                members: {
                    deleteMany: {
                        id: memberId,
                        profileId: {
                            not: profile.id
                        }
                    }
                }
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
        return NextResponse.json(mapServer(server));


    } catch (error) {
        console.log("[MEMBERS_ID_DELETE] error:", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params } : { params: Promise<{ memberId: string }> }
) {
    try {
        const { memberId } = await params;
        const profile = await currentProfile();
        const { searchParams } = new URL(req.url);
        const { role } = await req.json();

        const serverId = searchParams.get("serverId");

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        if (!serverId) {
            return new NextResponse("Server ID is required", { status: 400 });
        }

        if (!memberId) {
            return new NextResponse("Member ID is required", { status: 400 });
        }

        const server = await db.server.update({
            where: {
                id: serverId,
                profileId: profile.id,
            },
            data: {
                members: {
                    update: {
                        where: {
                            id: memberId,
                            profileId: {
                                not: profile.id
                            }
                        },
                        data: {
                            role
                        }
                    }
                }
            },
            include: {
                members: {
                    include: {
                        profile: true,
                        memberRoles: { include: { role: true } },
                    },
                    orderBy: {
                        role: "asc"
                    }
                }
            }
        });

        return NextResponse.json(mapServer(server));

    } catch (error) {
        console.log("[MEMBERS_ID_PATCH] error:", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}