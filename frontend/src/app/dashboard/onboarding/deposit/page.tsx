"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CreditCard, Wallet, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function DepositPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState("20");
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulation of a payment process
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/stripe/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as any)?.id,
          amount: parseFloat(amount),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await update({ 
            ...session, 
            user: { 
                ...session?.user, 
                hasDeposited: true,
                creditLimit: 80
            } 
        });
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

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-card-border rounded-3xl p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 blur-[80px] rounded-full"></div>
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Dépôt réussi !</h2>
            <p className="text-muted-text mb-6">
              Félicitations ! Votre compte a été alimenté de {amount} €. <br/>
              <span className="text-primary font-bold">Votre limite de crédit est désormais de 80 €.</span>
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
      <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
              Alimentez <br/> votre <span className="text-primary">Wallet</span>
            </h1>
            <p className="text-muted-text font-medium">
              Un dépôt de 20 € minimum débloque votre compte et vous offre un bonus de bienvenue de <span className="text-foreground font-bold">80 €</span> instantanément.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 text-sm text-muted-text">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span>Paiement sécurisé par Stripe</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-text">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Accès immédiat aux fonds</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-3xl p-6 shadow-2xl space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted-text uppercase tracking-wider mb-2 ml-1">Montant à déposer (€)</label>
            <div className="relative">
               <input
                type="number"
                min="20"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-card-border rounded-xl px-4 py-3 text-2xl font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-text font-bold">EUR</span>
            </div>
          </div>

          <div className="space-y-4">
             <label className="block text-xs font-bold text-muted-text uppercase tracking-wider ml-1">Informations de carte</label>
             <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nom sur la carte"
                  required
                  className="w-full bg-white/5 border border-card-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    required
                    className="w-full bg-white/5 border border-card-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                    className="w-full bg-white/5 border border-card-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    maxLength={3}
                    required
                    className="w-full bg-white/5 border border-card-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
             </div>
          </div>

          <button
            type="submit"
            disabled={loading || parseFloat(amount) < 20}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Traitement..." : `Payer ${amount} €`}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
          
          <p className="text-[10px] text-muted-text text-center uppercase font-bold tracking-tighter">
            En payant, vous acceptez nos conditions générales de crédit.
          </p>
        </form>
      </div>
    </div>
  );
}
