"use client";

import { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, Loader2, Fingerprint } from "lucide-react";
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
    if (!hasPin || pathname.includes("/login") || pathname.includes("/register")) return;

    const checkLock = () => {
      // Don't check if already locked to prevent unnecessary renders
      if (isLocked) return;
      
      const unlockedAt = sessionStorage.getItem("jd_unlocked_at");
      if (!unlockedAt) {
        setIsLocked(true);
      } else {
        // Lock after 1 minute of inactivity
        const timePassed = Date.now() - parseInt(unlockedAt);
        if (timePassed > 60 * 1000) {
          setIsLocked(true);
        }
      }
    };

    checkLock();

    // Periodic check every 5 seconds
    const interval = setInterval(checkLock, 5000);

    // Throttle activity updates to avoid writing to storage constantly
    let lastUpdate = Date.now();
    const updateActivity = () => {
      const now = Date.now();
      if (!isLocked && now - lastUpdate > 2000) {
        sessionStorage.setItem("jd_unlocked_at", now.toString());
        lastUpdate = now;
      }
    };

    // iOS and PWA reliable background detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkLock();
      } else {
        // App is going to background, save the exact exit time
        if (!isLocked) sessionStorage.setItem("jd_unlocked_at", Date.now().toString());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("touchstart", updateActivity, { passive: true });
    document.addEventListener("click", updateActivity, { passive: true });

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("touchstart", updateActivity);
      document.removeEventListener("click", updateActivity);
    };
  }, [hasPin, pathname, isLocked]);

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
        // Vibrate if supported
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) {
      verifyPin();
    }
  }, [pin]);

  if (!isLocked) {
    return <>{children}</>;
  }

  // Render the Lock Screen blocking the entire app
  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 h-[100dvh] w-screen">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
      
      <div className="w-full h-full max-w-md flex flex-col justify-center px-8 pb-12 relative z-10">
         
         <div className="text-center space-y-6 mb-12">
            <div className="w-24 h-24 bg-card border border-card-border rounded-[2.5rem] shadow-2xl flex items-center justify-center mx-auto text-primary relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-colors"></div>
               <ShieldCheck size={40} className="relative z-10" />
            </div>
            
            <div className="space-y-2">
               <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                 Bienvenue
               </h1>
               <p className="text-[11px] text-muted-text font-bold uppercase tracking-[0.2em]">
                 Saisissez votre code PIN
               </p>
            </div>
         </div>

         <div className="flex justify-center gap-6 mb-12">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  pin.length > i 
                    ? 'bg-primary scale-125 shadow-[0_0_15px_rgba(81,32,179,0.6)]' 
                    : (error ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-card border border-card-border')
                }`}
              ></div>
            ))}
         </div>

         <div className="grid grid-cols-3 gap-4 max-w-[320px] mx-auto w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
               <button 
                  key={num}
                  disabled={loading}
                  onClick={() => {
                     setError(false);
                     if (pin.length < 4) setPin(pin + num);
                  }}
                  className="h-20 rounded-[2rem] bg-card/50 backdrop-blur-md border border-card-border text-3xl font-light hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all text-foreground shadow-lg flex items-center justify-center"
               >
                  {num}
               </button>
            ))}
            
            {/* Biometric fallback or Logout */}
            <button 
               onClick={() => window.location.href = "/login"}
               className="h-20 rounded-[2rem] text-muted-text hover:text-foreground active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
            >
               <span className="text-[9px] font-black uppercase tracking-widest">Oublié ?</span>
            </button>
            
            <button 
               disabled={loading}
               onClick={() => {
                  setError(false);
                  if (pin.length < 4) setPin(pin + "0");
               }}
               className="h-20 rounded-[2rem] bg-card/50 backdrop-blur-md border border-card-border text-3xl font-light hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all text-foreground shadow-lg flex items-center justify-center"
            >
               0
            </button>
            
            <button 
               onClick={() => {
                  setError(false);
                  setPin(pin.slice(0, -1));
               }}
               className="h-20 rounded-[2rem] text-muted-text hover:text-foreground active:scale-95 transition-all flex items-center justify-center text-sm font-black uppercase tracking-widest"
            >
               DEL
            </button>
         </div>

         {loading && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
               <Loader2 className="animate-spin text-primary" size={32} />
               <p className="text-[10px] font-bold uppercase tracking-widest text-muted-text">Vérification...</p>
            </div>
         )}
      </div>
    </div>
  );
}
