"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const LogoutButton = () => {
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut({
      redirectUrl: "/"
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-gray-600 hover:text-red-600 hover:bg-red-50"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  );
};
