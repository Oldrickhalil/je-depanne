"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle2, X } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface VerifyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export default function VerifyEmailModal({ isOpen, onClose, email }: VerifyEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleResend = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        addToast("Nouveau lien envoyé avec succès !", "SUCCESS");
      } else {
        const data = await res.json();
        addToast(data.message || "Erreur lors de l'envoi.", "ERROR");
      }
    } catch (err) {
      addToast("Impossible de contacter le serveur.", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center animate-in fade-in duration-300 h-[100dvh] w-screen">
      <div className="w-full h-full max-w-none md:max-w-sm bg-card border-none md:border md:border-card-border md:rounded-[2.5rem] md:h-auto p-8 space-y-8 relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col justify-center">
         <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
         
         <button 
           onClick={onClose}
           className="absolute top-8 right-8 text-muted-text hover:text-foreground transition-colors p-2"
         >
           <X size={24} />
         </button>

         <div className="text-center space-y-6 pt-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary relative overflow-hidden">
               <div className="absolute inset-0 bg-primary/20 blur-xl"></div>
               <Mail size={32} className="relative z-10" />
            </div>
            
            <div className="space-y-2">
               <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">
                 Vérifiez votre e-mail
               </h2>
               <p className="text-[11px] text-muted-text font-bold uppercase tracking-[0.2em] leading-relaxed">
                 Un lien de vérification a été envoyé à :<br/>
                 <span className="text-primary mt-1 block">{email}</span>
               </p>
            </div>
         </div>

         <div className="bg-background p-5 rounded-2xl border border-card-border text-center space-y-2">
            <p className="text-[10px] text-muted-text font-medium leading-relaxed">
              Veuillez cliquer sur le bouton présent dans le mail pour activer votre compte. Vérifiez vos spams si vous ne le voyez pas.
            </p>
         </div>

         <div className="space-y-3">
            <button 
               onClick={handleResend}
               disabled={loading}
               className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
            >
               {loading ? <Loader2 className="animate-spin" size={18} /> : (
                 <>
                   Renvoyer le lien
                 </>
               )}
            </button>
            <button 
               onClick={onClose}
               className="w-full py-4 text-muted-text hover:text-foreground font-black uppercase tracking-widest text-[9px] transition-colors"
            >
               Fermer
            </button>
         </div>

         <p className="text-center text-[8px] text-muted-text uppercase tracking-widest font-bold">
            Je Dépanne • Sécurité Bancaire
         </p>
      </div>
    </div>
  );
}
