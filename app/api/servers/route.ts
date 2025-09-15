import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { MemberRole } from "@/lib/generated/prisma"; 
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
 

export async function POST(request: Request) {
    try{
        console.log("[SERVER_POST] Starting server creation...");
        
        const { name, imageUrl } = await request.json();
        console.log("[SERVER_POST] Request data:", { name, imageUrl });
        
        const profile = await currentProfile();
        console.log("[SERVER_POST] Current profile:", profile ? { id: profile.id, userId: profile.userId, name: profile.name } : null);

        if (!profile) {
            console.log("[SERVER_POST] No profile found, returning 401");
            return new Response("Unauthorized", { status: 401 });
        }

        console.log("[SERVER_POST] Creating server with data:", {
            name,
            imageUrl,
            profileId: profile.id,
            inviteCode: "generating...",
        });

        const server = await db.server.create({
            data:{
                name,
                imageUrl,
                profileId: profile.id,
                inviteCode: uuidv4(),
                channels: {
                    create: [
                        { name: "general", profileId: profile.id  }
                    ]
                },
                members: {
                    create: [
                        { profileId: profile.id, role: MemberRole.ADMIN}
                    ]
                }
                }
        });
        
        console.log("[SERVER_POST] Server created successfully:", server.id);
        return NextResponse.json(server);

    }catch (error) {
        console.error("[SERVER_POST] Error details:", error);
        if (error instanceof Error) {
            console.error("[SERVER_POST] Error message:", error.message);
            console.error("[SERVER_POST] Error stack:", error.stack);
        }
        return new Response("Internal error", { status: 500 });
    } 
}