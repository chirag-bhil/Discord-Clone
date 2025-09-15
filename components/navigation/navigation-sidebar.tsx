import { currentProfile } from "@/lib/current-profile";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { NavigationAction } from "./navigation-action";

export const NavigationSidebar =  async () => {

    const profile = await currentProfile();

    if (!profile) {
        return redirect("/sign-in");
    }

    const server = await db.server.findFirst({
        where: {
            members: {
                some: {
                    profileId: profile.id
                }
            }
        }
    });

    return ( 
        <div className="space-y-4 flex flex-col item-center h-full text-primary w-full dark:bg-[#1E1F22] py-3">  
            <NavigationAction /> 
            <Separator 
                className="h-[1px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto"
            />
        </div>
    ); 
}