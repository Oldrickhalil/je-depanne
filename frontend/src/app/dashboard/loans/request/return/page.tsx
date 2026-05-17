"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function StripeReturnPage() {
  const [status, setStep] = useState<"loading" | "success" | "error">("loading");
  const router = useRouter();

  useEffect(() => {
    // In a real app, we might call our backend to verify the Stripe account status here.
    // For now, if the user returns to this URL, Stripe has finished the session.
    const timer = setTimeout(() => {
      setStep("success");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-700">
      {status === "loading" && (
        <>
          <div className="relative">
             <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse"></div>
             <Loader2 size={64} className="text-primary animate-spin relative z-10" />
          </div>
          <div className="space-y-2">
             <h2 className="text-2xl font-title font-bold uppercase tracking-tighter">Finalisation de la vérification</h2>
             <p className="text-muted-text text-[10px] font-bold uppercase tracking-wider">Veuillez patienter quelques instants...</p>
          </div>
        </>
      )}

      {status === "success" && (
        <>
          <div className="relative">
             <div className="absolute inset-0 bg-green-500/20 blur-3xl animate-pulse"></div>
             <CheckCircle2 size={64} className="text-green-500 relative z-10" />
          </div>
          <div className="space-y-4">
             <div className="space-y-1">
                <h2 className="text-3xl font-title font-bold uppercase tracking-tighter">Vérification Réussie</h2>
                <p className="text-muted-text text-[10px] font-bold uppercase tracking-wider">Votre compte personnel est maintenant configuré</p>
             </div>
             <button 
               onClick={() => router.push("/dashboard/loans/request?step=confirm")}
               className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg glow-primary"
             >
                Continuer la demande
             </button>
          </div>
        </>
      )}
    </div>
  );
}
