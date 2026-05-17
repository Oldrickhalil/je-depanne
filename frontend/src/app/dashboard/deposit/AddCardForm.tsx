"use client";

import { useState } from "react";
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
import { ShieldCheck, Loader2, Check, AlertCircle, X } from "lucide-react";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#ffffff",
      fontFamily: 'LigaSans, sans-serif',
      fontSize: "14px",
      "::placeholder": { color: "#374151" },
    },
    invalid: { color: "#ef4444", iconColor: "#ef4444" },
  },
};

export default function AddCardForm({ userId, onSuccess, onCancel }: { userId: string, onSuccess: () => void, onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // 1. Créer le SetupIntent (0€) pour valider la carte
      const res = await fetch(`${apiUrl}/api/stripe/setup-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const { clientSecret, message } = await res.json();
      if (!res.ok) throw new Error(message || "Erreur d'initialisation.");

      // 2. Confirmer la carte (gère le 3DS sans débit)
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement)!,
          billing_details: { name },
        },
      });

      if (result.error) {
        setError(result.error.message || "Échec de l'enregistrement.");
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4 h-[100dvh] w-screen animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8 relative shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
        
        <button onClick={onCancel} className="absolute top-6 right-6 text-muted-text hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Ajouter une carte</h2>
          <p className="text-[10px] text-muted-text font-bold uppercase tracking-wider leading-relaxed px-4">
            Enregistrez votre carte en toute sécurité pour vos futurs dépôts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <p className="text-[10px] text-red-500 font-bold uppercase leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Titulaire</label>
              <input
                type="text" required placeholder="NOM PRÉNOM" value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                className="w-full bg-background border border-card-border rounded-xl py-4 px-5 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Numéro de carte</label>
              <div className="w-full bg-background border border-card-border rounded-xl py-4 px-5 focus-within:border-primary/50 transition-all shadow-inner">
                <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
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
                <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">CVC</label>
                <div className="w-full bg-background border border-card-border rounded-xl py-4 px-5 focus-within:border-primary/50 transition-all shadow-inner">
                  <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-[2rem] hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Enregistrer <Check size={18} /></>}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-[8px] text-gray-700 font-bold uppercase tracking-wider">
          <ShieldCheck size={12} className="text-green-500" />
          <span>Protection Stripe 3D Secure 2.0</span>
        </div>
      </div>
    </div>
  );
}
