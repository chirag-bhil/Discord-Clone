import { Server, Member, Channel, Profile } from "@/lib/generated/prisma";

export type ServerWithMembersWithProfile = Server & {
    members: (Member & {profile: Profile})[];
}