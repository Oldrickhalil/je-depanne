"use client";

import { useState, useEffect } from "react";
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
import { ShieldCheck, Loader2, ArrowRight, CreditCard, AlertCircle } from "lucide-react";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#ffffff",
      fontFamily: ' LigaSans, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "14px",
      "::placeholder": {
        color: "#374151",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
};

export default function CardForm({ amount, userId, onSuccess }: { amount: number, userId: string, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string>("unknown");
  const [name, setName] = useState("");
  const [saveCard, setSaveCard] = useState(true);

  const handleCardChange = (event: any) => {
    if (event.brand) {
      setCardBrand(event.brand);
    }
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // 1. Créer le PaymentIntent sur le backend (avec option sauvegarde)
      const res = await fetch(`${apiUrl}/api/stripe/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount, saveCard }),
      });

      const { clientSecret, message } = await res.json();
      if (!res.ok) throw new Error(message || "Erreur lors de l'initialisation.");

      // 2. Confirmer le paiement avec Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement)!,
          billing_details: { name },
        },
      });

      if (result.error) {
        setError(result.error.message || "Paiement échoué.");
      } else {
        if (result.paymentIntent.status === "succeeded") {
          onSuccess();
        } else {
          setError("Le paiement est en cours de traitement.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
           <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
           <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight leading-relaxed">{error}</p>
        </div>
      )}

      <div className="space-y-4">
         <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Titulaire de la carte</label>
            <input
              type="text"
              required
              placeholder="NOM PRÉNOM"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              className="w-full bg-background border border-card-border rounded-xl py-4 px-5 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-800"
            />
         </div>

         <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Numéro de carte</label>
            <div className="relative">
               <div className="w-full bg-background border border-card-border rounded-xl py-4 px-5 focus-within:border-primary/50 transition-all shadow-inner">
                  <CardNumberElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardChange} />
               </div>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {cardBrand === 'visa' && <img src="/images/visa.svg" alt="Visa" className="h-4" />}
                  {cardBrand === 'mastercard' && <img src="/images/mastercard.svg" alt="Mastercard" className="h-5" />}
                  {cardBrand === 'unknown' && <CreditCard size={18} className="text-gray-700" />}
               </div>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Expiration</label>
               <div className="w-full bg-background border border-card-border rounded-xl py-4 px-5 focus-within:border-primary/50 transition-all shadow-inner">
                  <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
               </div>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Code CVC</label>
               <div className="w-full bg-background border border-card-border rounded-xl py-4 px-5 focus-within:border-primary/50 transition-all shadow-inner">
                  <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
               </div>
            </div>
         </div>

         {/* Save Card Checkbox */}
         <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl cursor-pointer" onClick={() => setSaveCard(!saveCard)}>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${saveCard ? 'bg-primary border-primary' : 'border-card-border'}`}>
               {saveCard && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
            </div>
            <div className="space-y-0.5">
               <p className="text-[10px] font-black uppercase text-foreground">Sauvegarder cette carte</p>
               <p className="text-[8px] text-muted-text uppercase font-bold tracking-tight">Pour vos prochains dépôts en un clic</p>
            </div>
         </div>
      </div>

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-[2rem] hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-white/5 active:scale-95"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : (
          <>
            Confirmer le Dépôt <ArrowRight size={18} />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-[8px] text-gray-700 font-bold uppercase tracking-wider">
        <ShieldCheck size={12} className="text-green-500" />
        <span>Cryptage SSL 256-bit sécurisé par Stripe</span>
      </div>
    </form>
  );
}
