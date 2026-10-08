import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as  SocketIOServer } from "socket.io";
import { Server, Member, Channel, Profile, Role } from "@/lib/generated/prisma";
import type { Prisma } from "@/lib/generated/prisma";

export type ServerWithMembersWithProfile = Server & {
    members: (Member & { profile: Profile; roles: Role[] })[];
};

// Payload shapes for queries that include the explicit Mongo MemberRoleLink join.
export type MemberWithMemberRoles = Prisma.MemberGetPayload<{
    include: { profile: true; memberRoles: { include: { role: true } } }
}>;

export type ServerWithMembersRoles = Prisma.ServerGetPayload<{
    include: { members: { include: { profile: true; memberRoles: { include: { role: true } } } } }
}>;

export type MessageWithMemberRoles = Prisma.MessageGetPayload<{
    include: { member: { include: { profile: true; memberRoles: { include: { role: true } } } } }
}>;

export type DirectMessageWithMemberRoles = Prisma.DirectMessageGetPayload<{
    include: { member: { include: { profile: true; memberRoles: { include: { role: true } } } } }
}>;

// Search/query parameter object passed around by chat & model components.
export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type NextApiResponseServerIo = NextApiResponse & {
    socket: Socket & {
        server: NetServer & {
            io: SocketIOServer
        }
    }
}
