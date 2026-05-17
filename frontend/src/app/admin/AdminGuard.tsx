"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    const isAdmin = (session?.user as any)?.role === "ADMIN";

    if (pathname === "/admin/login") {
       if (isAdmin) {
          router.push("/admin/loans");
       } else {
          setIsAuthorized(true);
       }
       return;
    }

    if (!session || !isAdmin) {
      router.push("/admin/login");
    } else {
      setIsAuthorized(true);
    }
  }, [session, status, router, pathname]);

  if (status === "loading" || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Vérification des accès Admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white selection:bg-amber-500/30">
      {children}
    </div>
  );
}
