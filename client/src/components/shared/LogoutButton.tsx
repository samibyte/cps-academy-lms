"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";

interface LogoutButtonProps {
  action: () => Promise<void>;
}

const LogoutButton = ({ action }: LogoutButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
      await action();
      router.push("/");
      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
      className="gap-2"
    >
      <LogOutIcon className="h-4 w-4" />
      {isPending ? "লগ আউট হচ্ছে..." : "লগ আউট"}
    </Button>
  );
};

export default LogoutButton;
