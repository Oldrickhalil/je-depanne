"use client";

import { useState } from "react";
import { CreditCard, Trash2, CheckCircle2, Loader2, Plus } from "lucide-react";

type PaymentMethod = {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
};

export default function SavedCards({ 
  userId, 
  onSelect, 
  selectedId, 
  onAddNew 
}: { 
  userId: string, 
  onSelect: (pmId: string) => void, 
  selectedId: string | null,
  onAddNew: () => void 
}) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchMethods = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/stripe/payment-methods/${userId}`);
      const data = await res.json();
      setMethods(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMethod = async (e: React.MouseEvent, pmId: string) => {
    e.stopPropagation();
    setDeleting(pmId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await fetch(`${apiUrl}/api/stripe/payment-methods/${pmId}`, { method: "DELETE" });
      setMethods(methods.filter(m => m.id !== pmId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  useState(() => { fetchMethods(); });

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {methods.map((pm) => (
        <div 
          key={pm.id}
          onClick={() => onSelect(pm.id)}
          className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedId === pm.id 
              ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
              : 'bg-background border-card-border hover:border-primary/30'
          }`}
        >
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center">
                {pm.card.brand === 'visa' && <img src="/images/visa.svg" alt="Visa" className="h-3" />}
                {pm.card.brand === 'mastercard' && <img src="/images/mastercard.svg" alt="Mastercard" className="h-4" />}
                {pm.card.brand !== 'visa' && pm.card.brand !== 'mastercard' && <CreditCard size={18} className="text-muted-text" />}
             </div>
             <div>
                <p className="text-sm font-black text-foreground uppercase tracking-tight">•••• {pm.card.last4}</p>
                <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest mt-0.5">Expire: {pm.card.exp_month}/{pm.card.exp_year}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             {selectedId === pm.id && <CheckCircle2 size={18} className="text-primary animate-in zoom-in duration-300" />}
             <button 
                onClick={(e) => deleteMethod(e, pm.id)}
                disabled={deleting === pm.id}
                className="p-2 text-muted-text hover:text-red-500 transition-colors"
             >
                {deleting === pm.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
             </button>
          </div>
        </div>
      ))}

      <button 
        onClick={onAddNew}
        className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl border border-dashed border-card-border hover:border-primary/50 text-muted-text hover:text-primary transition-all group"
      >
         <Plus size={16} className="group-hover:scale-110 transition-transform" />
         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Utiliser une autre carte</span>
      </button>
    </div>
  );
}
