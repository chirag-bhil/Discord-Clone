import { initialProfile } from "@/lib/initial-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SetupWrapper } from "@/components/setup-wrapper";

const RootPage = async () => {
    const profile = await initialProfile();

    if (!profile) {
        return redirect("/sign-in");
    }

    // Find the first server the user is a member of
    const server = await db.server.findFirst({
        where: {
            members: {
                some: {
                    profileId: profile.id
                }
            }
        }
    });

    // If the user is part of a server, redirect to that server
    if (server) {
        return redirect(`/servers/${server.id}`);
    }

    // If the user has a profile but no server, show the creation modal
    return (
        <div className="h-full">
            <SetupWrapper />
        </div>
    );
}

export default RootPage;
