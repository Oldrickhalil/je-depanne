"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export default function PinVerificationModal({ isOpen, onClose, onSuccess, title = "Vérification requise", description = "Saisissez votre code PIN pour valider cette action" }: PinVerificationModalProps) {
  const { data: session } = useSession();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError(false);
      setLoading(false);
    }
  }, [isOpen]);

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
        setPin("");
        onSuccess();
      } else {
        setError(true);
        setPin("");
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

  // Auto-submit
  useEffect(() => {
    if (pin.length === 4) {
      verifyPin();
    }
  }, [pin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 h-[100dvh] w-screen">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
      
      <div className="w-full h-full max-w-md flex flex-col justify-center px-8 pb-12 relative z-10">
         
         <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-card border border-card-border rounded-2xl shadow-xl flex items-center justify-center mx-auto text-primary relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/20 blur-xl"></div>
               <ShieldCheck size={28} className="relative z-10" />
            </div>
            
            <div className="space-y-1">
               <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">
                 {title}
               </h2>
               <p className="text-[10px] text-muted-text font-bold uppercase tracking-[0.2em] px-4">
                 {description}
               </p>
            </div>
         </div>

         <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  pin.length > i 
                    ? 'bg-primary scale-125 shadow-[0_0_10px_rgba(81,32,179,0.6)]' 
                    : (error ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'bg-card border border-card-border')
                }`}
              ></div>
            ))}
         </div>

         {error && (
            <p className="text-center text-red-500 text-[9px] font-black uppercase tracking-widest animate-bounce mb-4">
               Code PIN incorrect
            </p>
         )}

         <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
               <button 
                  key={num}
                  disabled={loading}
                  onClick={() => {
                     setError(false);
                     if (pin.length < 4) setPin(pin + num);
                  }}
                  className="h-16 rounded-[1.5rem] bg-card/50 backdrop-blur-md border border-card-border text-2xl font-light hover:bg-foreground/5 active:bg-foreground/10 active:scale-95 transition-all text-foreground shadow-sm flex items-center justify-center"
               >
                  {num}
               </button>
            ))}
            
            <button 
               onClick={onClose}
               className="h-16 rounded-[1.5rem] text-muted-text hover:text-foreground active:scale-95 transition-all flex items-center justify-center text-[9px] font-black uppercase tracking-widest"
            >
               Annuler
            </button>
            
            <button 
               disabled={loading}
               onClick={() => {
                  setError(false);
                  if (pin.length < 4) setPin(pin + "0");
               }}
               className="h-16 rounded-[1.5rem] bg-card/50 backdrop-blur-md border border-card-border text-2xl font-light hover:bg-foreground/5 active:bg-foreground/10 active:scale-95 transition-all text-foreground shadow-sm flex items-center justify-center"
            >
               0
            </button>
            
            <button 
               onClick={() => {
                  setError(false);
                  setPin(pin.slice(0, -1));
               }}
               className="h-16 rounded-[1.5rem] text-muted-text hover:text-foreground active:scale-95 transition-all flex items-center justify-center text-sm font-black uppercase tracking-widest"
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
