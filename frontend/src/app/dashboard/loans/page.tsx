"use client";

import { useSession } from "next-auth/react";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Info, 
  Loader2,
  Zap,
  Calendar,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

type Loan = {
  id: string;
  amount: number;
  termMonths: number;
  interestRate: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID_BACK';
  createdAt: string;
};

export default function MyLoansPage() {
  const { data: session } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      const userId = (session?.user as any)?.id;
      if (!userId) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/loans/user/${userId}`);
        const data = await res.json();
        setLoans(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des prêts:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchLoans();
  }, [session]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "En attente", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock };
      case "APPROVED":
        return { label: "Approuvé", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2 };
      case "REJECTED":
        return { label: "Refusé", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle };
      case "PAID_BACK":
        return { label: "Remboursé", color: "text-blue-500", bg: "bg-blue-500/10", icon: CheckCircle2 };
      default:
        return { label: "Inconnu", color: "text-gray-500", bg: "bg-gray-500/10", icon: Info };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors mb-4">
             <ArrowLeft size={12} /> Tableau de Bord
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none">
            Mes <span className="text-primary">Prêts</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[9px] flex items-center gap-2">
            Historique complet de vos financements
          </p>
        </div>
        
        <Link 
          href="/dashboard/loans/request"
          className="px-6 py-3 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-gray-200 transition-all flex items-center gap-2"
        >
          <Zap size={14} fill="currentColor" /> Nouveau Prêt
        </Link>
      </section>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: "Total Emprunté", val: `${loans.filter(l => l.status === 'APPROVED' || l.status === 'PAID_BACK').reduce((acc, curr) => acc + curr.amount, 0)} €`, icon: Wallet, color: "text-primary" },
           { label: "Prêts Actifs", val: loans.filter(l => l.status === 'APPROVED').length, icon: Zap, color: "text-green-500" },
           { label: "En Analyse", val: loans.filter(l => l.status === 'PENDING').length, icon: Clock, color: "text-amber-500" },
           { label: "Remboursés", val: loans.filter(l => l.status === 'PAID_BACK').length, icon: CheckCircle2, color: "text-blue-500" }
         ].map((stat, i) => (
           <div key={i} className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2rem] space-y-2">
              <stat.icon size={14} className={stat.color} />
              <div>
                 <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">{stat.label}</p>
                 <p className="text-xl font-black tracking-tighter text-white">{stat.val}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Main List */}
      <div className="space-y-6">
         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 pl-2">Détails des demandes</h3>
         
         {loading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="animate-spin text-primary" size={32} />
            </div>
         ) : loans.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
               {loans.map((loan) => {
                 const status = getStatusDisplay(loan.status);
                 const StatusIcon = status.icon;
                 return (
                    <div key={loan.id} className="group relative overflow-hidden rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 hover:border-primary/20 transition-all duration-500 p-8">
                       <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Zap size={80} className="text-primary" />
                       </div>
                       
                       <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div className="flex items-center gap-6">
                             <div className={`w-16 h-16 rounded-[1.5rem] ${status.bg} flex items-center justify-center border border-white/5`}>
                                <StatusIcon size={24} className={status.color} />
                             </div>
                             <div>
                                <div className="flex items-center gap-3 mb-1">
                                   <p className="text-lg font-black uppercase tracking-tight text-white">{loan.amount} €</p>
                                   <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                                      {status.label}
                                   </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                      <Calendar size={12} /> {new Date(loan.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                   </div>
                                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                      <Clock size={12} /> {loan.termMonths} mois
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center gap-10">
                             <div className="space-y-1">
                                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">ID Demande</p>
                                <p className="text-[10px] font-mono font-bold text-gray-400">#JD-{loan.id.slice(0, 8).toUpperCase()}</p>
                             </div>
                             <div className="space-y-1 text-right">
                                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Taux</p>
                                <p className="text-[10px] font-bold text-white">{(loan.interestRate * 100).toFixed(1)}% Fixe</p>
                             </div>
                             <div className="space-y-1 text-right">
                                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Total à Rembourser</p>
                                <p className="text-sm font-black text-primary tracking-tighter">{(loan.amount * (1 + loan.interestRate)).toFixed(2)} €</p>
                             </div>
                          </div>
                          {loan.status === 'APPROVED' && (
                             <div className="mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-white/5 md:pl-6 md:border-l flex justify-end">
                                <Link 
                                   href="/dashboard/schedule"
                                   className="px-6 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all shadow-xl active:scale-95"
                                >
                                   Rembourser
                                </Link>
                             </div>
                          )}
                       </div>
                    </div>
                 );
               })}
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-[3rem] bg-[#0c0c0c] border border-white/5 border-dashed space-y-4">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-700">
                  <Info size={24} />
               </div>
               <div className="text-center space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-white">Aucun prêt pour le moment</p>
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Vos futures demandes apparaîtront ici.</p>
               </div>
               <Link href="/dashboard/loans/request" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline pt-2">
                  Faire ma première demande
               </Link>
            </div>
         )}
      </div>

    </div>
  );
}
