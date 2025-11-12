import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "./ui/avatar";

interface UserAvatarProps {
    src?: string;
    className?: string;
};


export const UserAvtar = ({
    src,
    className,
}: UserAvatarProps) => {
    return (
        <Avatar className={cn("h-10 w-10", className)}>
            <AvatarImage src={src} alt="User Avatar" />
        </Avatar>
    );
}