"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy terminal route — redirects to the Portal page.
 * The actual terminal functionality lives at /portal?adminId=...
 */
export default function TerminalPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8EAEF]">
      <p className="text-muted-foreground">Weiterleitung...</p>
    </div>
  );
}
