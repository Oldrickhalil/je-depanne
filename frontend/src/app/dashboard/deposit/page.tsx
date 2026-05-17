"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Wallet, ShieldCheck, CheckCircle2, Loader2, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import StripePayment from "./StripePayment";
import SavedCards from "./SavedCards";

export default function DepositPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState("50");
  const [freshStatus, setFreshStatus] = useState<any>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  const [mode, setMode] = useState<'selection' | 'new_card'>('selection');
  const [selectedPmId, setSelectedPmId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const user = session?.user as any;
  const userId = user?.id;

  useEffect(() => {
    const fetchStatus = async () => {
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
        }
      } catch (err) {
        console.error("Erreur récupération statut:", err);
      } finally {
        setIsFetchingStatus(false);
      }
    };
    
    fetchStatus();
  }, [userId]);

  const isFirstDeposit = freshStatus ? !freshStatus.hasDeposited : !user?.hasDeposited;

  const handleSuccess = async () => {
    await update(); 
    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 4000);
  };

  const handleSavedCardPay = async () => {
    if (!selectedPmId || !userId) return;
    setPaying(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/stripe/deposit/saved-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          paymentMethodId: selectedPmId
        }),
      });

      const data = await res.json();

      if (res.ok) {
        handleSuccess();
      } else if (res.status === 402 && data.clientSecret) {
         // 3DS Required for saved card
         // We would need to load Stripe here and confirm the payment.
         // For now, let's just show an error or redirect to new card.
         setError("Une vérification 3D Secure est requise pour cette carte. Veuillez utiliser l'option 'Nouvelle Carte' pour ce dépôt.");
      } else {
        setError(data.message || "Échec du paiement.");
      }
    } catch (err) {
      setError("Erreur de connexion.");
    } finally {
      setPaying(false);
    }
  };

  if (isFetchingStatus) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-card-border rounded-3xl p-10 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 blur-[80px] rounded-full"></div>
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase text-foreground mb-2 tracking-tighter">Dépôt Réussi !</h2>
            <p className="text-xs text-muted-text font-bold uppercase tracking-widest leading-relaxed mb-6">
              Votre compte a été crédité avec succès. <br/>
              {isFirstDeposit && <span className="text-primary mt-2 block">Bonus de bienvenue ajouté !</span>}
            </p>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 animate-[loading_4s_ease-in-out]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 items-start pt-10 pb-20">
        
        {/* Left Side: Info */}
        <div className="space-y-8 md:sticky md:top-24">
           <div className="space-y-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-text hover:text-foreground transition-colors mb-4">
                 <ArrowLeft size={12} /> Retour
              </Link>
              <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-5xl font-title font-bold tracking-tighter text-foreground leading-[0.9] uppercase">
                Alimenter <br/> <span className="text-primary">Mon Compte</span>
              </h1>
              <p className="text-muted-text font-medium text-sm leading-relaxed max-w-sm">
                {isFirstDeposit 
                  ? "Un dépôt initial sécurise votre profil et débloque instantanément votre bonus de bienvenue de 80€."
                  : "Ajoutez des fonds instantanément via notre passerelle sécurisée Stripe."}
              </p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-card border border-card-border space-y-1">
                 <p className="text-[8px] font-black uppercase text-muted-text tracking-widest">Sécurité</p>
                 <p className="text-[10px] font-bold text-foreground uppercase">3D Secure 2.0</p>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-card-border space-y-1">
                 <p className="text-[8px] font-black uppercase text-muted-text tracking-widest">Rapidité</p>
                 <p className="text-[10px] font-bold text-foreground uppercase">Instantané</p>
              </div>
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-card border border-card-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent"></div>
          
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-muted-text uppercase tracking-widest ml-1 text-center">Montant du dépôt</label>
            <div className="relative">
               <input
                type="number"
                min={isFirstDeposit ? "20" : "10"}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-background border border-card-border rounded-2xl px-4 py-5 text-4xl font-black text-foreground text-center focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                placeholder={isFirstDeposit ? "20" : "50"}
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-text font-black text-xl">€</span>
            </div>
            {isFirstDeposit && <p className="text-[9px] text-primary font-black uppercase tracking-widest text-center">Dépôt min. 20€ pour le bonus</p>}
          </div>

          <div className="w-full h-px bg-card-border"></div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
               <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
               <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight leading-relaxed">{error}</p>
            </div>
          )}

          {userId && (
            mode === 'selection' ? (
              <div className="space-y-6">
                <label className="block text-[9px] font-black text-muted-text uppercase tracking-[0.2em] ml-1">Choisir une carte</label>
                <SavedCards 
                  userId={userId} 
                  selectedId={selectedPmId} 
                  onSelect={setSelectedPmId} 
                  onAddNew={() => setMode('new_card')} 
                />
                
                <button
                  onClick={handleSavedCardPay}
                  disabled={!selectedPmId || paying || parseFloat(amount) < (isFirstDeposit ? 20 : 10)}
                  className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.4em] rounded-[2rem] hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl active:scale-95"
                >
                  {paying ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      Payer avec cette carte <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <label className="block text-[9px] font-black text-muted-text uppercase tracking-[0.2em] ml-1">Nouvelle Carte</label>
                   <button onClick={() => setMode('selection')} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Voir mes cartes</button>
                </div>
                <StripePayment 
                  amount={parseFloat(amount) || 0} 
                  userId={userId} 
                  onSuccess={handleSuccess} 
                />
              </div>
            )
          )}
          
          <div className="flex items-center justify-center gap-2 text-[8px] text-gray-700 font-bold uppercase tracking-widest">
            <ShieldCheck size={12} className="text-green-500" />
            <span>Cryptage SSL 256-bit sécurisé par Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
