"use client";

import { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function AppLock({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const hasPin = session && (session.user as any)?.hasPin;

  useEffect(() => {
    // Check if the app should be locked on load or return from background
    const checkLock = () => {
      if (hasPin && !pathname.includes("/login") && !pathname.includes("/register")) {
        const unlockedAt = sessionStorage.getItem("jd_unlocked_at");
        if (!unlockedAt) {
          setIsLocked(true);
        } else {
          // Optional: Lock after 5 minutes of inactivity
          const timePassed = Date.now() - parseInt(unlockedAt);
          if (timePassed > 5 * 60 * 1000) {
            setIsLocked(true);
          } else {
             // Refresh timer
             sessionStorage.setItem("jd_unlocked_at", Date.now().toString());
          }
        }
      }
    };

    checkLock();

    // Re-check when window regains focus (user comes back to app)
    window.addEventListener("focus", checkLock);
    return () => window.removeEventListener("focus", checkLock);
  }, [hasPin, pathname]);

  const verifyPin = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setError(false);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const userId = (session?.user as any)?.id;

      const res = await fetch(`${apiUrl}/api/auth/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pinCode: pin }),
      });

      if (res.ok) {
        sessionStorage.setItem("jd_unlocked_at", Date.now().toString());
        setIsLocked(false);
        setPin("");
      } else {
        setError(true);
        setPin("");
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  // Render the Lock Screen blocking the entire app
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-sm space-y-12">
         
         <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary mb-6">
               <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
              Je Dépanne
            </h1>
            <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest">
              Veuillez saisir votre code PIN
            </p>
         </div>

         <div className="flex justify-center gap-6 py-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-primary scale-125 shadow-[0_0_15px_rgba(81,32,179,0.5)]' : (error ? 'bg-red-500 animate-pulse' : 'bg-card border border-card-border')}`}></div>
            ))}
         </div>

         {error && (
            <p className="text-center text-red-500 text-[10px] font-black uppercase tracking-widest animate-bounce">
               Code PIN incorrect
            </p>
         )}

         <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
               <button 
                  key={num}
                  onClick={() => {
                     setError(false);
                     if (pin.length < 4) setPin(pin + num);
                  }}
                  className="h-16 rounded-3xl bg-card border border-card-border text-2xl font-light hover:bg-foreground/5 active:scale-90 transition-all text-foreground"
               >
                  {num}
               </button>
            ))}
            <button 
               onClick={() => {
                 // Option to logout/switch account
                 window.location.href = "/login";
               }}
               className="h-16 rounded-3xl text-muted-text text-[9px] font-black uppercase tracking-widest hover:text-foreground active:scale-90 transition-all"
            >
               Quitter
            </button>
            <button 
               onClick={() => {
                  setError(false);
                  if (pin.length < 4) setPin(pin + "0");
               }}
               className="h-16 rounded-3xl bg-card border border-card-border text-2xl font-light hover:bg-foreground/5 active:scale-90 transition-all text-foreground"
            >
               0
            </button>
            <button 
               onClick={() => {
                  setError(false);
                  setPin(pin.slice(0, -1));
               }}
               className="h-16 rounded-3xl text-muted-text text-sm font-black uppercase tracking-widest hover:text-foreground active:scale-90 transition-all"
            >
               Del
            </button>
         </div>

         <div className="pt-4">
            <button 
               disabled={pin.length < 4 || loading}
               onClick={verifyPin}
               className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[2rem] shadow-lg shadow-primary/20 disabled:opacity-30 transition-all flex items-center justify-center"
            >
               {loading ? <Loader2 className="animate-spin" size={18} /> : "Déverrouiller"}
            </button>
         </div>

      </div>
    </div>
  );
}
