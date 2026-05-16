"use client";

import { PieChart, TrendingUp, BarChart3, Activity, ArrowLeft, Download, Zap } from "lucide-react";
import Link from "next/link";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function StatsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const [loansRes, transRes] = await Promise.all([
           fetch(`${apiUrl}/api/loans/user/${userId}`),
           fetch(`${apiUrl}/api/activity/transactions/${userId}`)
        ]);
        
        if (loansRes.ok) setLoans(await loansRes.json());
        if (transRes.ok) setTransactions(await transRes.json());
      } catch (err) {
        console.error("Error fetching stats data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchData();
  }, [session, userId]);

  if (!session) return null;
  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  const totalBorrowed = loans.filter(l => l.status === 'APPROVED' || l.status === 'PAID_BACK').reduce((acc, curr) => acc + curr.amount, 0);
  const totalRepaid = transactions.filter(t => t.type === 'REPAYMENT').reduce((acc, curr) => acc + curr.amount, 0);
  const activeLoansCount = loans.filter(l => l.status === 'APPROVED').length;
  const repaidLoansCount = loans.filter(l => l.status === 'PAID_BACK').length;
  const repaymentRate = (activeLoansCount + repaidLoansCount) === 0 ? 100 : Math.round((repaidLoansCount / (activeLoansCount + repaidLoansCount)) * 100);

  // Générer les 6 derniers mois
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.toLocaleDateString('fr-FR', { month: 'short' }),
      year: d.getFullYear(),
      monthNum: d.getMonth()
    };
  });

  // Agréger les données du graphique (Emprunts vs Remboursements)
  const chartData = last6Months.map(m => {
     let emprunts = 0;
     let remboursements = 0;

     transactions.forEach(t => {
        const tDate = new Date(t.createdAt);
        if (tDate.getMonth() === m.monthNum && tDate.getFullYear() === m.year) {
           if (t.type === 'LOAN_DISBURSEMENT') emprunts += t.amount;
           if (t.type === 'REPAYMENT') remboursements += t.amount;
        }
     });

     // Calculate percentage relative to a max value for the chart (e.g., 5000 max)
     // Fallback to 1000 if no data
     const maxVal = Math.max(1000, ...transactions.map(t => t.amount));
     
     return {
        month: m.month,
        val1: Math.min(100, Math.round((emprunts / maxVal) * 100)),
        val2: Math.min(100, Math.round((remboursements / maxVal) * 100)),
        rawEmprunts: emprunts,
        rawRemboursements: remboursements
     };
  });
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-text hover:text-foreground transition-colors mb-4">
             <ArrowLeft size={12} /> Tableau de Bord
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none">
            Analyses <span className="text-primary">& Stats</span>
          </h1>
          <p className="text-muted-text font-bold uppercase tracking-[0.2em] text-[9px] flex items-center gap-2">
            Vue détaillée de votre activité financière
          </p>
        </div>
        
        <button className="px-6 py-3 bg-white/5 border border-card-border text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-white/10 transition-all flex items-center gap-2">
          <Download size={14} /> Exporter (PDF)
        </button>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-card border border-card-border p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
               <TrendingUp size={80} className="text-primary" />
            </div>
            <div className="space-y-4 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                  <Activity size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-text">Total Emprunté</p>
                  <p className="text-4xl font-black tracking-tighter text-foreground mt-1">{totalBorrowed.toFixed(2)} €</p>
               </div>
               <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full rounded-full" style={{ width: `${Math.min((totalBorrowed / 10000) * 100, 100)}%` }}></div>
               </div>
               <p className="text-[9px] font-bold text-muted-text uppercase tracking-widest">
                  {activeLoansCount} prêt(s) en cours • {repaidLoansCount} terminé(s)
               </p>
            </div>
         </div>

         <div className="bg-card border border-card-border p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
               <BarChart3 size={80} className="text-blue-500" />
            </div>
            <div className="space-y-4 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
                  <BarChart3 size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-text">Taux de Remboursement</p>
                  <p className="text-4xl font-black tracking-tighter text-foreground mt-1">{repaymentRate}%</p>
               </div>
               <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${repaymentRate}%` }}></div>
               </div>
               <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">+ {repaymentRate === 100 ? 'Excellent' : 'Bon'} Profil</p>
            </div>
         </div>

         <div className="bg-primary p-8 rounded-[2.5rem] relative overflow-hidden group shadow-lg shadow-primary/20 flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
               <Zap size={80} className="text-foreground" />
            </div>
            <div className="space-y-4 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-white/20 text-foreground flex items-center justify-center backdrop-blur-sm">
                  <PieChart size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Total Remboursé</p>
                  <p className="text-4xl font-black tracking-tighter text-foreground mt-1">{totalRepaid.toFixed(2)} <span className="text-xl opacity-70">€</span></p>
               </div>
            </div>
            <Link 
               href="/dashboard/schedule"
               className="mt-6 w-full py-4 bg-white text-primary text-center font-black rounded-2xl hover:bg-gray-200 transition-all uppercase text-[10px] tracking-widest shadow-xl active:scale-95 block relative z-10"
            >
               Voir les échéanciers
            </Link>
         </div>
      </div>

      {/* Chart Section (Mockup) */}
      <div className="bg-card border border-card-border rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
         <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div className="space-y-1">
               <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Activité Mensuelle</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-muted-text">Dépenses vs Remboursements (6 derniers mois)</p>
            </div>
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-card-border">
               <button className="px-4 py-2 bg-background text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">6 Mois</button>
               <button className="px-4 py-2 text-muted-text hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors">1 An</button>
               <button className="px-4 py-2 text-muted-text hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors">Tout</button>
            </div>
         </div>

         {/* Faux Graphique à barres stylisé en CSS */}
         <div className="h-64 flex items-end gap-2 md:gap-6 pt-4 relative">
            {/* Lignes de repère */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
               {[100, 75, 50, 25, 0].map(val => (
                  <div key={val} className="w-full border-b border-card-border relative">
                     <span className="absolute -top-2 -left-8 text-[8px] font-bold text-muted-text">{val}%</span>
                  </div>
               ))}
            </div>

            {/* Barres */}
            {chartData.map((data, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-4 relative z-10 group">
                  <div className="w-full flex items-end justify-center gap-1 md:gap-2 h-[200px]">
                     <div 
                        className="w-1/3 max-w-[20px] bg-white/10 rounded-t-sm group-hover:bg-white/20 transition-all relative"
                        style={{ height: `${data.val1}%` }}
                     >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-foreground text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">{data.rawEmprunts}€</div>
                     </div>
                     <div 
                        className="w-1/3 max-w-[20px] bg-primary rounded-t-sm shadow-[0_0_15px_rgba(81,32,179,0.5)] group-hover:brightness-125 transition-all relative"
                        style={{ height: `${data.val2}%` }}
                     >
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">{data.rawRemboursements}€</div>
                     </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-text">{data.month}</span>
               </div>
            ))}
         </div>

         <div className="flex items-center justify-center gap-8 mt-10">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-sm bg-white/10"></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-muted-text">Emprunts</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-sm bg-primary shadow-[0_0_10px_rgba(81,32,179,0.5)]"></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-muted-text">Remboursements</span>
            </div>
         </div>
      </div>
    </div>
  );
}
