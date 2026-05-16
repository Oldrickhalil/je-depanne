"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CreditCard, Wallet, ArrowRight, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";

export default function DepositPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState("50");
  const [freshStatus, setFreshStatus] = useState<any>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  
  const user = session?.user as any;
  const userId = user?.id; // Try to get ID from session

  useEffect(() => {
    const fetchStatus = async () => {
      // If no session yet, wait
      if (!session) return;
      
      // If we have an email but no ID, we might need a different endpoint, but let's assume API needs ID.
      // Actually, if userId is missing, let's try to get it from the backend using a /me endpoint if it existed.
      // But we have /api/auth/status/:userId. If userId is undefined, this fails.
      if (!userId) {
         setIsFetchingStatus(false);
         return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/auth/status/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setFreshStatus(data);
          // Auto-correct session if it's stale
          if (data.hasDeposited !== user?.hasDeposited) {
             await update({
               ...session,
               user: {
                 ...session?.user,
                 hasDeposited: data.hasDeposited,
                 kycVerified: data.kycVerified,
                 isInstalled: data.isInstalled,
                 creditLimit: data.creditLimit
               }
             });
          }
        }
      } catch (err) {
        console.error("Erreur récupération statut:", err);
      } finally {
        setIsFetchingStatus(false);
      }
    };
    
    fetchStatus();
  }, [session, userId, update, user?.hasDeposited]);

  const isFirstDeposit = freshStatus ? !freshStatus.hasDeposited : !user?.hasDeposited;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/stripe/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          amount: parseFloat(amount),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Force session update to reflect new balance and status
        await update(); 
        
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      }
    } catch (error) {
      console.error("Deposit error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isFetchingStatus) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="text-primary" size={32} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-card-border rounded-3xl p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 blur-[80px] rounded-full"></div>
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase text-foreground mb-2 tracking-tighter">Transfert Réussi !</h2>
            <p className="text-muted-text text-xs font-bold uppercase tracking-widest leading-relaxed mb-6">
              Votre compte a été crédité de {amount} €. <br/>
              {isFirstDeposit && <span className="text-primary">Votre bonus de 80€ a également été ajouté !</span>}
            </p>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 animate-[loading_3s_ease-in-out]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-title font-bold tracking-tight text-foreground mb-4 leading-none uppercase">
              Alimenter <br/> <span className="text-primary">Mon Compte</span>
            </h1>
            <p className="text-muted-text font-medium text-sm leading-relaxed">
              {isFirstDeposit 
                ? "Un dépôt de 20 € minimum débloque votre compte et vous offre un bonus de bienvenue de 80 € instantanément."
                : "Ajoutez des fonds instantanément pour augmenter votre solde disponible ou rembourser vos crédits."}
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-text">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span>Sécurité Stripe Paylive</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-[2.5rem] p-8 shadow-2xl space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-muted-text uppercase tracking-widest ml-1 text-center">Montant du dépôt</label>
            <div className="relative">
               <input
                type="number"
                min={isFirstDeposit ? "20" : "10"}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-card border border-card-border rounded-2xl px-4 py-4 text-3xl font-black text-foreground text-center focus:outline-none focus:border-primary/50 transition-colors"
                placeholder={isFirstDeposit ? "20" : "50"}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-text font-black">€</span>
            </div>
            {isFirstDeposit && <p className="text-[9px] text-primary font-black uppercase tracking-widest text-center mt-2">Dépôt min. 20€ pour le bonus</p>}
          </div>

          <div className="space-y-4">
             <label className="block text-[9px] font-black text-muted-text uppercase tracking-[0.2em] ml-1">Carte de Paiement</label>
             <div className="space-y-3">
                <input
                  type="text"
                  placeholder="TITULAIRE DE LA CARTE"
                  required
                  className="w-full bg-card border border-card-border rounded-xl py-3.5 px-5 text-[10px] font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-800"
                />
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    required
                    className="w-full bg-card border border-card-border rounded-xl py-3.5 px-5 text-[10px] font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-800"
                  />
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                    className="w-full bg-card border border-card-border rounded-xl py-3.5 px-5 text-[10px] font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-800"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    maxLength={3}
                    required
                    className="w-full bg-card border border-card-border rounded-xl py-3.5 px-5 text-[10px] font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-800"
                  />
                </div>
             </div>
          </div>

          <button
            type="submit"
            disabled={loading || parseFloat(amount) < (isFirstDeposit ? 20 : 10)}
            className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.4em] rounded-[2rem] hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                Payer {amount} € <ArrowRight size={18} />
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center gap-2 text-[8px] text-gray-700 font-bold uppercase tracking-widest">
            <ShieldCheck size={12} />
            <span>Cryptage de données SSL 256-bit</span>
          </div>
        </form>
      </div>
    </div>
  );
}
