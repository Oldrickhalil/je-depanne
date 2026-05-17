"use client";

import { useState, useEffect } from "react";
import { Lock, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastProvider";

export default function PinOnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"create" | "confirm">("create");

  useEffect(() => {
     if (session && (session.user as any).hasPin) {
        router.push("/dashboard");
     }
  }, [session, router]);

  const handleSetPin = async () => {
    if (pin.length < 4 || pin !== confirmPin) {
      addToast("Les codes PIN ne correspondent pas.", "ERROR");
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
        addToast("Code PIN sécurisé avec succès !", "SUCCESS");
        await update({ ...session, user: { ...session?.user, hasPin: true } });
        window.location.href = "/dashboard"; 
      } else {
        throw new Error("Erreur serveur");
      }
    } catch (error: any) {
      console.error(error);
      addToast("Erreur lors de la configuration.", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-card-border rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full"></div>

        <Link href="/dashboard" className="absolute top-6 left-6 text-muted-text hover:text-foreground">
           <ArrowLeft size={20} />
        </Link>

        <div className="text-center space-y-4 pt-4">
          <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Code de Sécurité</h1>
          <p className="text-muted-text">
            {step === "create" ? "Créez votre code PIN à 4 chiffres." : "Confirmez votre code PIN."}
          </p>
        </div>

        <div className="flex justify-center gap-4 py-4">
           {[0, 1, 2, 3].map((i) => {
              const currentPin = step === "create" ? pin : confirmPin;
              return (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${currentPin.length > i ? 'bg-amber-500 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-background border border-card-border'}`}></div>
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
                 className="h-16 rounded-2xl bg-background border border-card-border text-2xl font-light hover:bg-foreground/5 active:scale-95 transition-all text-foreground"
              >
                 {num}
              </button>
           ))}
           <button 
              onClick={() => {
                 if (step === "confirm") {
                    setConfirmPin("");
                    setStep("create");
                 } else {
                    setPin("");
                 }
              }}
              className="h-16 rounded-2xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 active:scale-95 transition-all"
           >
              Effacer
           </button>
           <button 
              onClick={() => {
                 if (step === "create" && pin.length < 4) setPin(pin + "0");
                 if (step === "confirm" && confirmPin.length < 4) setConfirmPin(confirmPin + "0");
              }}
              className="h-16 rounded-2xl bg-background border border-card-border text-2xl font-light hover:bg-foreground/5 active:scale-95 transition-all text-foreground"
           >
              0
           </button>
           <button 
              disabled={(step === "create" && pin.length < 4) || (step === "confirm" && confirmPin.length < 4) || loading}
              onClick={() => {
                 if (step === "create") setStep("confirm");
                 else handleSetPin();
              }}
              className="h-16 rounded-2xl bg-amber-500 text-white font-black text-xl hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
           >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "OK"}
           </button>
        </div>
      </div>
    </div>
  );
}
