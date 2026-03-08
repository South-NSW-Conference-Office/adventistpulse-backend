"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait for silent session restore

    if (!accessToken || !user) {
      router.replace("/");
      return;
    }

    if (!user.emailVerified) {
      router.replace("/pending-verification");
      return;
    }

    const status = user.accountStatus ?? "approved";
    if (status === "pending_onboarding") { router.replace("/onboarding");        return; }
    if (status === "pending_approval")   { router.replace("/pending-approval");  return; }
    if (status === "rejected")           { router.replace("/onboarding");        return; }
  }, [user, accessToken, isLoading, router]);

  // Don't flash the dashboard while redirecting
  if (isLoading || !accessToken || !user) return null;
  if (user.accountStatus && user.accountStatus !== "approved")  return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F5F7]">
      {children}
    </div>
  );
}
