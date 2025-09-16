import { currentProfile } from "@/lib/current-profile";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { NavigationAction } from "./navigation-action";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationItem } from "./navigation-item";
import { ModeToggle } from "../mode-toggle";
import { UserButton } from "@clerk/nextjs";


export const NavigationSidebar = async () => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/sign-in");
  }

  const servers = await db.server.findMany({
    where: {
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary w-[72px] dark:bg-[#1E1F22] py-3">
      <NavigationAction />
      <div className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10" />
      <ScrollArea className="flex-1 w-full">
        {servers.map((server) => (
            <div key={server.id} className="mb-4">
                <NavigationItem
                    id={server.id}
                    imageUrl={server.imageUrl}
                    name={server.name}
                />
            </div>
        ))}
      </ScrollArea>
      <div className="pb-3 mt-auto flex item-center items-center flex-col gap-y-4">
        <ModeToggle />
        <UserButton
            appearance={{
                elements: {
                    avatarBox: "w-[48px] h-[48px]"
                },
            }} 
        />

      </div>

    </div>
  );
};