"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, ShieldCheck, CheckCircle2, Loader2, Building, ArrowUpRight, CreditCard } from "lucide-react";
import PinVerificationModal from "@/components/dashboard/PinVerificationModal";

export default function WithdrawPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState("");
  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [freshStatus, setFreshStatus] = useState<any>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showPinModal, setShowPinModal] = useState(false);
  
  const user = session?.user as any;
  const userId = user?.id;

  useEffect(() => {
    const fetchStatus = async () => {
      if (!session) return;
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
          if (data.iban) setIban(data.iban);
          if (data.bankName) setBankName(data.bankName);
        }
      } catch (err) {
        console.error("Erreur récupération statut:", err);
      } finally {
        setIsFetchingStatus(false);
      }
    };
    fetchStatus();
  }, [session, userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
       setError("Veuillez saisir un montant valide.");
       return;
    }
    
    if (freshStatus && withdrawAmount > freshStatus.balance) {
       setError("Fonds insuffisants sur votre solde disponible.");
       return;
    }

    setShowPinModal(true);
  };

  const executeWithdrawal = async () => {
    setLoading(true);
    setError(null);
    setShowPinModal(false);

    const withdrawAmount = parseFloat(amount);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/stripe/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          amount: withdrawAmount,
          iban,
          bankName
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await update(); 
        
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setError(data.message || "Une erreur est survenue lors du retrait.");
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  if (isFetchingStatus) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={32} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-card-border rounded-3xl p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full"></div>
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase text-foreground mb-2 tracking-tighter">Retrait Initié</h2>
            <p className="text-muted-text text-xs font-bold uppercase tracking-widest leading-relaxed mb-6">
              Votre transfert de {amount} € vers le compte {bankName} est en cours de traitement par Stripe.
            </p>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-[loading_3s_ease-in-out]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <PinVerificationModal 
         isOpen={showPinModal} 
         onClose={() => setShowPinModal(false)} 
         onSuccess={executeWithdrawal} 
         title="Validation du Retrait"
         description={`Saisissez votre code PIN pour valider le transfert de ${amount} €`}
      />
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <ArrowUpRight className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-title font-bold tracking-tight text-foreground mb-4 leading-none uppercase">
              Retirer <br/> <span className="text-primary">Mes Fonds</span>
            </h1>
            <p className="text-muted-text font-medium text-sm leading-relaxed">
              Transférez instantanément votre solde disponible vers votre compte bancaire personnel. Les informations saisies seront sauvegardées pour vos prochains retraits.
            </p>
          </div>

          <div className="bg-background p-6 rounded-3xl border border-card-border space-y-2">
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-text">Solde Disponible</p>
             <p className="text-3xl font-black text-foreground">{freshStatus?.balance?.toFixed(2) || "0.00"} €</p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-text">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Transfert Sécurisé Stripe</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-[2.5rem] p-8 shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Montant à retirer</label>
            <div className="relative">
               <input
                type="number"
                min="10"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-card border border-card-border rounded-2xl px-4 py-4 text-3xl font-black text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="0.00"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-text font-black">€</span>
            </div>
            <p className="text-[9px] text-muted-text font-black uppercase tracking-widest mt-2 flex justify-between">
              <span>Min. 10 €</span>
              <button 
                 type="button" 
                 onClick={() => setAmount(freshStatus?.balance?.toString() || "0")}
                 className="text-primary hover:underline"
              >
                 Tout retirer
              </button>
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-card-border">
             <label className="block text-[9px] font-black text-muted-text uppercase tracking-[0.2em] ml-1">Informations Bancaires (Bénéficiaire)</label>
             <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="NOM DE LA BANQUE (EX: BOURSORAMA)"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl py-3.5 px-11 text-[10px] font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-800"
                  />
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="IBAN (EX: FR76...)"
                    required
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl py-3.5 px-11 text-[10px] font-bold text-foreground uppercase focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-800"
                  />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                </div>
             </div>
             <p className="text-[8px] font-black uppercase tracking-widest text-muted-text text-center">Ces informations seront sauvegardées dans vos paramètres.</p>
          </div>

          <button
            type="submit"
            disabled={loading || !amount || parseFloat(amount) < 10 || parseFloat(amount) > (freshStatus?.balance || 0)}
            className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.4em] rounded-[2rem] hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                Confirmer le Retrait <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
