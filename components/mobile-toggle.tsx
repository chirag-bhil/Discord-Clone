import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "./ui/button"
import { NavigationSidebar } from "@/components/navigation/navigation-sidebar"
import { ServerSidebar } from "@/components/server/server-sidebar"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export const MobileToggle = ({
    serverId
}: { serverId: string }) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 gap-0 flex-row">
                <VisuallyHidden>
                    <SheetTitle>Navigation</SheetTitle>
                </VisuallyHidden>
                <div className="w-[72px]">
                    <NavigationSidebar />
                </div>
                <ServerSidebar serverId={serverId} />
            </SheetContent>
        </Sheet>
    )
}