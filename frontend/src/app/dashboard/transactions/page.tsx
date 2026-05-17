"use client";

import { useSession } from "next-auth/react";
import { 
  ArrowLeft, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCcw, 
  CreditCard,
  Zap,
  Wallet,
  Loader2,
  Filter
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearch } from "@/context/SearchContext";

type Transaction = {
  id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_DISBURSEMENT' | 'REPAYMENT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
};

export default function TransactionsPage() {
  const { data: session } = useSession();
  const { searchQuery } = useSearch();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  useEffect(() => {
    const fetchTransactions = async () => {
      const userId = (session?.user as any)?.id;
      if (!userId) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/activity/transactions/${userId}`);
        const data = await res.json();
        if (res.ok) setTransactions(data);
      } catch (err) {
        console.error("Erreur récupération transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchTransactions();
  }, [session]);

  const getTransactionDetails = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return { label: 'Dépôt', icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-500/10', sign: '+' };
      case 'LOAN_DISBURSEMENT':
        return { label: 'Déblocage de Prêt', icon: Zap, color: 'text-primary', bg: 'bg-primary/10', sign: '+' };
      case 'WITHDRAWAL':
        return { label: 'Retrait', icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-500/10', sign: '-' };
      case 'REPAYMENT':
        return { label: 'Remboursement', icon: RefreshCcw, color: 'text-amber-500', bg: 'bg-amber-500/10', sign: '-' };
      default:
        return { label: 'Transaction', icon: Wallet, color: 'text-muted-text', bg: 'bg-white/5', sign: '' };
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const details = getTransactionDetails(t.type);
    const matchesSearch = searchQuery === "" || 
      details.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.amount.toString().includes(searchQuery) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'ALL') return true;
    if (filter === 'IN') return t.type === 'DEPOSIT' || t.type === 'LOAN_DISBURSEMENT';
    if (filter === 'OUT') return t.type === 'WITHDRAWAL' || t.type === 'REPAYMENT';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-muted-text hover:text-foreground transition-colors mb-4">
             <ArrowLeft size={12} /> Retour
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none text-foreground">
            Historique <span className="text-primary">Financier</span>
          </h1>
          <p className="text-muted-text font-bold uppercase tracking-wider text-[9px] flex items-center gap-2">
            Traçabilité de vos fonds en temps réel
          </p>
        </div>
        
        <div className="flex bg-card p-1 rounded-2xl border border-card-border">
           <button 
             onClick={() => setFilter('ALL')}
             className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${filter === 'ALL' ? 'bg-white/10 text-white' : 'text-muted-text hover:text-white'}`}
           >
             Tout
           </button>
           <button 
             onClick={() => setFilter('IN')}
             className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${filter === 'IN' ? 'bg-green-500/20 text-green-500' : 'text-muted-text hover:text-white'}`}
           >
             <ArrowDownLeft size={12} /> Entrées
           </button>
           <button 
             onClick={() => setFilter('OUT')}
             className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${filter === 'OUT' ? 'bg-red-500/20 text-red-500' : 'text-muted-text hover:text-white'}`}
           >
             <ArrowUpRight size={12} /> Sorties
           </button>
        </div>
      </section>

      {/* Main List */}
      <div className="space-y-4">
         {loading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="animate-spin text-primary" size={32} />
            </div>
         ) : filteredTransactions.length > 0 ? (
            <div className="space-y-3">
               {filteredTransactions.map((t) => {
                 const details = getTransactionDetails(t.type);
                 const Icon = details.icon;
                 return (
                    <div key={t.id} className="group flex items-center justify-between p-6 rounded-[2rem] bg-card border border-card-border hover:border-primary/20 transition-all duration-500 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl ${details.bg} ${details.color} flex items-center justify-center shadow-inner`}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-tight text-foreground">{details.label}</p>
                                <p className="text-[9px] text-muted-text font-bold uppercase tracking-wider">{new Date(t.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })} • ID: {t.id.slice(0, 6)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <p className={`text-lg font-black tracking-tighter ${details.color}`}>
                               {details.sign}{t.amount.toFixed(2)} €
                           </p>
                           <p className="text-[8px] font-black uppercase tracking-wider text-muted-text mt-1">{t.status}</p>
                        </div>
                    </div>
                 );
               })}
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-[3rem] bg-card border border-card-border border-dashed space-y-4">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-700">
                  <CreditCard size={24} />
               </div>
               <div className="text-center space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-foreground">Aucune transaction trouvée</p>
                  <p className="text-[9px] font-bold text-muted-text uppercase tracking-wider">Essayez un autre mot-clé ou modifiez vos filtres.</p>
               </div>
            </div>
         )}
      </div>

    </div>
  );
}
