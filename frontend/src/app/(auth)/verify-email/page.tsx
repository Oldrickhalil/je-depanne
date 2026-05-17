"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("error");
        setMessage("Jeton de vérification manquant.");
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Votre adresse e-mail a été vérifiée avec succès.");
        } else {
          setStatus("error");
          setMessage(data.message || "Le lien est invalide ou a expiré.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Impossible de contacter le serveur.");
      }
    };

    verifyToken();
  }, [searchParams]);

  return (
    <div className="w-full max-w-md bg-card border border-card-border rounded-[2.5rem] p-10 space-y-8 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
      <div className={`absolute top-0 left-0 w-full h-2 ${status === 'loading' ? 'bg-primary' : status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
      
      {status === "loading" && (
        <div className="space-y-6 py-4">
           <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
              <Loader2 size={40} className="animate-spin" />
           </div>
           <div className="space-y-2">
              <h1 className="text-2xl font-black uppercase tracking-tighter">Vérification...</h1>
              <p className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Nous activons votre compte</p>
           </div>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-8 py-4">
           <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-lg shadow-green-500/10">
              <CheckCircle2 size={48} />
           </div>
           <div className="space-y-3">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Bravo !</h1>
              <p className="text-xs text-muted-text font-bold uppercase tracking-wider leading-relaxed px-4">
                {message}
              </p>
           </div>
           <Link 
             href="/login"
             className="flex items-center justify-center gap-3 w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
           >
             Se connecter <ArrowRight size={18} />
           </Link>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-8 py-4">
           <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <XCircle size={48} />
           </div>
           <div className="space-y-3">
              <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground">Erreur</h1>
              <p className="text-xs text-red-500 font-bold uppercase tracking-wider leading-relaxed px-4">
                {message}
              </p>
           </div>
           <Link 
             href="/login"
             className="flex items-center justify-center gap-3 w-full py-5 bg-background border border-card-border text-foreground font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-white/5 transition-all"
           >
             Retour à l'accueil
           </Link>
        </div>
      )}

      <p className="text-center text-[8px] text-gray-700 font-bold uppercase tracking-wider">
         JE DÉPANNE • SÉCURITÉ BANCAIRE
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Suspense fallback={<Loader2 className="animate-spin text-primary" size={40} />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
