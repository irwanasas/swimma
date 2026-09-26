"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SuperadminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/superadmin/logout", { method: "POST" });
    router.push("/superadmin/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      Keluar
    </Button>
  );
}
