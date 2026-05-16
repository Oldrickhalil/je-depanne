"use client";

import { useState, useEffect } from "react";
import { Lock, Loader2, KeyRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "next/navigation";

export default function PinNotificationPrompt({ hasPin }: { hasPin: boolean }) {
  const { data: session, update } = useSession();
  const { addToast } = useToast();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"create" | "confirm">("create");

  useEffect(() => {
    if (session && hasPin === false) {
      setShowPrompt(true);
    } else if (hasPin === true) {
      setShowPrompt(false);
    }
  }, [session, hasPin]);

  const handleSetPin = async () => {
    if (pin.length < 4 || pin !== confirmPin) {
      addToast("Les codes PIN ne correspondent pas ou sont trop courts.", "ERROR");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const userId = (session?.user as any)?.id;

      const res = await fetch(`${apiUrl}/api/auth/set-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pinCode: pin }),
      });

      if (res.ok) {
        addToast("Code PIN configuré avec succès !", "SUCCESS");
        setShowPrompt(false);
        setShowSetup(false);
        // Force refresh session status
        window.location.reload(); 
      } else {
        throw new Error("Erreur serveur");
      }
    } catch (error: any) {
      console.error(error);
      addToast("Impossible de configurer le PIN.", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Banner */}
      {!showSetup && (
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/20 p-5 rounded-3xl mb-8 flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 shadow-xl shadow-amber-500/5">
           <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                 <Lock size={20} />
              </div>
              <div className="space-y-1">
                 <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Sécurisez votre application</h3>
                 <p className="text-[10px] text-muted-text font-medium leading-relaxed max-w-sm">
                    Configurez un code PIN pour protéger l'accès à votre portefeuille et à vos prêts.
                 </p>
              </div>
           </div>
           <button 
              onClick={() => setShowSetup(true)}
              className="px-6 py-3 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
           >
              Configurer
           </button>
        </div>
      )}

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-4 animate-in fade-in duration-300 h-[100dvh] w-screen">
           <div className="w-full h-full max-w-md bg-card border-none md:border md:border-card-border md:h-auto rounded-none md:rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden shadow-none md:shadow-2xl flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
              
              <div className="text-center space-y-4 pt-4">
                 <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
                    <KeyRound size={28} />
                 </div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                   {step === "create" ? "Créer un PIN" : "Confirmer le PIN"}
                 </h2>
                 <p className="text-[10px] text-muted-text uppercase tracking-widest">
                   Code à 4 chiffres obligatoire
                 </p>
              </div>

              <div className="flex justify-center gap-4 py-4">
                 {[0, 1, 2, 3].map((i) => {
                    const currentPin = step === "create" ? pin : confirmPin;
                    return (
                      <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${currentPin.length > i ? 'bg-amber-500 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-card-border'}`}></div>
                    );
                 })}
              </div>

              <div className="grid grid-cols-3 gap-4">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button 
                       key={num}
                       onClick={() => {
                          if (step === "create" && pin.length < 4) setPin(pin + num);
                          if (step === "confirm" && confirmPin.length < 4) setConfirmPin(confirmPin + num);
                       }}
                       className="h-16 rounded-2xl bg-background border border-card-border text-2xl font-light hover:bg-white/10 active:scale-95 transition-all text-foreground"
                    >
                       {num}
                    </button>
                 ))}
                 <button 
                    onClick={() => setShowSetup(false)}
                    className="h-16 rounded-2xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 active:scale-95 transition-all"
                 >
                    Annuler
                 </button>
                 <button 
                    onClick={() => {
                       if (step === "create" && pin.length < 4) setPin(pin + "0");
                       if (step === "confirm" && confirmPin.length < 4) setConfirmPin(confirmPin + "0");
                    }}
                    className="h-16 rounded-2xl bg-background border border-card-border text-2xl font-light hover:bg-white/10 active:scale-95 transition-all text-foreground"
                 >
                    0
                 </button>
                 <button 
                    onClick={() => {
                       if (step === "create") setPin(pin.slice(0, -1));
                       if (step === "confirm") setConfirmPin(confirmPin.slice(0, -1));
                    }}
                    className="h-16 rounded-2xl bg-background border border-card-border text-sm font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all text-foreground"
                 >
                    Effacer
                 </button>
              </div>

              <button 
                 disabled={loading || (step === "create" && pin.length < 4) || (step === "confirm" && confirmPin.length < 4)}
                 onClick={() => {
                    if (step === "create") setStep("confirm");
                    else handleSetPin();
                 }}
                 className="w-full py-5 bg-amber-500 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-lg shadow-amber-500/20 disabled:opacity-30 transition-all flex items-center justify-center"
              >
                 {loading ? <Loader2 className="animate-spin" size={18} /> : (step === "create" ? "Continuer" : "Valider le PIN")}
              </button>
           </div>
        </div>
      )}
    </>
  );
}
