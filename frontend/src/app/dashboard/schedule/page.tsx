"use client";

import { useSession } from "next-auth/react";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Loader2,
  RefreshCcw,
  AlertCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

import PinVerificationModal from "@/components/dashboard/PinVerificationModal";

type Loan = {
  id: string;
  amount: number;
  amountRepaid: number;
  termMonths: number;
  interestRate: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID_BACK';
  createdAt: string;
};

export default function SchedulePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [successModal, setSuccessModal] = useState<{show: boolean, message: string} | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{ 
    show: boolean, 
    loanId: string, 
    amount: number, 
    type: 'MONTHLY' | 'FULL' 
  } | null>(null);

  useEffect(() => {
    const fetchLoans = async () => {
      const userId = (session?.user as any)?.id;
      if (!userId) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/loans/user/${userId}`);
        const data = await res.json();
        if (res.ok) {
           setLoans(data.filter((l: Loan) => l.status === 'APPROVED' || l.status === 'PAID_BACK'));
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des prêts:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchLoans();
  }, [session]);

  const executeRepayment = async () => {
    if (!confirmModal) return;
    const { loanId, amount, type } = confirmModal;
    
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    setRepaying(loanId);
    setError(null);
    setConfirmModal(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/loans/${loanId}/repay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, paymentAmount: amount })
      });

      const data = await res.json();

      if (res.ok) {
         await update(); 
         setLoans(loans.map(l => l.id === loanId ? { ...l, amountRepaid: data.loan.amountRepaid, status: data.loan.status } : l));
         
         // Trigger Toast and Success Modal
         addToast("Paiement validé avec succès", "SUCCESS");
         setSuccessModal({
           show: true, 
           message: type === 'FULL' || data.loan.status === 'PAID_BACK'
             ? `Félicitations, vous avez soldé votre prêt avec ce paiement de ${amount.toFixed(2)} € !`
             : `Votre mensualité de ${amount.toFixed(2)} € a été réglée avec succès.`
         });
      } else {
         setError(data.message || "Erreur lors du remboursement.");
      }
    } catch (err) {
       setError("Impossible de contacter le serveur.");
    } finally {
       setRepaying(null);
    }
  };

  const activeLoans = loans.filter(l => l.status === 'APPROVED');
  const paidLoans = loans.filter(l => l.status === 'PAID_BACK');

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 relative">
      
      {/* Success Modal */}
      {successModal?.show && (
         <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-card-border rounded-[2.5rem] w-full max-w-md p-10 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-500 text-center overflow-hidden">
               <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 blur-[80px] rounded-full"></div>
               
               <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                 <div className="absolute inset-0 bg-green-500 blur-xl opacity-20"></div>
                 <CheckCircle2 className="w-12 h-12 text-green-500 relative z-10" />
               </div>

               <div className="space-y-4">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Paiement Réussi</h2>
                  <p className="text-xs text-muted-text font-bold uppercase tracking-widest leading-relaxed px-2">
                    {successModal.message}
                  </p>
               </div>

               <button 
                 onClick={() => setSuccessModal(null)}
                 className="w-full mt-6 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all uppercase text-[10px] tracking-widest shadow-xl"
               >
                 Fermer
               </button>
            </div>
         </div>
      )}

      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard/stats" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-text hover:text-foreground transition-colors mb-4">
             <ArrowLeft size={12} /> Analyses & Stats
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none">
            Mes <span className="text-primary">Échéanciers</span>
          </h1>
          <p className="text-muted-text font-bold uppercase tracking-[0.2em] text-[9px] flex items-center gap-2">
            Gérez vos remboursements en cours
          </p>
        </div>
      </section>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
           <AlertCircle size={20} className="shrink-0 mt-0.5" />
           <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest">Échec du paiement</p>
              <p className="text-[10px] font-medium opacity-80 uppercase tracking-tight">{error}</p>
           </div>
        </div>
      )}

      {loading ? (
         <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
         </div>
      ) : (
         <div className="space-y-10">
            {/* Active Loans */}
            <div className="space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-text pl-2">À Rembourser</h3>
               
               {activeLoans.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                     {activeLoans.map(loan => {
                        const totalDue = loan.amount * (1 + loan.interestRate);
                        const remainingBalance = Math.max(0, totalDue - (loan.amountRepaid || 0));
                        const monthlyPayment = totalDue / loan.termMonths;
                        
                        // If remaining balance is less than a normal monthly payment, adjust it
                        const nextPaymentAmount = Math.min(monthlyPayment, remainingBalance);
                        const progressPercent = Math.min(100, ((loan.amountRepaid || 0) / totalDue) * 100);

                        return (
                           <div key={loan.id} className="bg-card border border-primary/20 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                              <div className="absolute top-0 right-0 p-6 opacity-5">
                                 <RefreshCcw size={120} className="text-primary" />
                              </div>
                              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                                 <div className="space-y-6 flex-1">
                                    <div>
                                       <p className="text-[10px] font-black uppercase tracking-widest text-primary">Solde Restant Dû</p>
                                       <p className="text-4xl font-black tracking-tighter text-foreground mt-1">{remainingBalance.toFixed(2)} €</p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                       <div className="flex justify-between text-[9px] font-bold text-muted-text uppercase tracking-widest">
                                          <span>Déjà remboursé : {(loan.amountRepaid || 0).toFixed(2)} €</span>
                                          <span>Total : {totalDue.toFixed(2)} €</span>
                                       </div>
                                       <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                                       </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                       <div className="bg-background p-4 rounded-2xl border border-card-border">
                                          <p className="text-[8px] text-muted-text uppercase tracking-widest font-bold">Mensualité</p>
                                          <p className="text-sm font-bold text-foreground">{monthlyPayment.toFixed(2)} € <span className="text-[9px] text-muted-text">/mois</span></p>
                                       </div>
                                       <div className="bg-background p-4 rounded-2xl border border-card-border">
                                          <p className="text-[8px] text-muted-text uppercase tracking-widest font-bold">Durée totale</p>
                                          <p className="text-sm font-bold text-foreground flex items-center gap-1.5"><Calendar size={12} className="text-primary" /> {loan.termMonths} mois</p>
                                       </div>
                                    </div>
                                 </div>
                                 
                                 <div className="flex flex-col justify-end gap-3 min-w-[220px]">
                                    <button 
                                       onClick={() => setConfirmModal({ show: true, loanId: loan.id, amount: nextPaymentAmount, type: 'MONTHLY' })}
                                       disabled={repaying === loan.id}
                                       className="w-full py-4 bg-white/10 text-foreground font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 border border-card-border"
                                    >
                                       Payer 1 mois ({nextPaymentAmount.toFixed(2)} €)
                                    </button>
                                    
                                    <button 
                                       onClick={() => setConfirmModal({ show: true, loanId: loan.id, amount: remainingBalance, type: 'FULL' })}
                                       disabled={repaying === loan.id}
                                       className="w-full py-5 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                       {repaying === loan.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                                       Solder le prêt
                                    </button>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               ) : (
                  <div className="bg-card border border-card-border rounded-[2rem] p-8 text-center space-y-2">
                     <p className="text-xs font-black uppercase tracking-widest text-foreground">Aucun prêt en cours</p>
                     <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Vous n'avez aucune échéance à régler.</p>
                  </div>
               )}
            </div>

            {/* Paid Loans */}
            {paidLoans.length > 0 && (
               <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-text pl-2">Historique des remboursements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {paidLoans.map(loan => (
                        <div key={loan.id} className="bg-card border border-card-border p-6 rounded-[2rem] flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                              <CheckCircle2 size={18} />
                           </div>
                           <div>
                              <p className="text-sm font-black text-foreground uppercase tracking-tight">{(loan.amount * (1 + loan.interestRate)).toFixed(2)} €</p>
                              <p className="text-[9px] font-bold text-muted-text uppercase tracking-widest mt-0.5">Payé et clôturé</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal?.show && (
         <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-card-border rounded-[2.5rem] w-full max-w-md p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-300 text-center">
               <button 
                  onClick={() => setConfirmModal(null)}
                  className="absolute top-6 right-6 text-muted-text hover:text-foreground transition-colors"
               >
                 <XCircle size={20} />
               </button>
               
               <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                 <RefreshCcw className="w-8 h-8 text-primary" />
               </div>

               <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Confirmer le paiement</h2>
                  <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest leading-relaxed px-4">
                    Êtes-vous sûr de vouloir payer <span className="text-foreground">{confirmModal.amount.toFixed(2)} €</span> depuis votre solde disponible ?
                  </p>
               </div>

               <div className="bg-background p-4 rounded-2xl border border-card-border text-center">
                 <p className="text-[9px] font-black uppercase tracking-widest text-muted-text">Type d'opération</p>
                 <p className="text-sm font-bold text-foreground uppercase tracking-tight">
                   {confirmModal.type === 'MONTHLY' ? 'Paiement d\'une mensualité' : 'Remboursement total'}
                 </p>
               </div>

               <div className="flex gap-4 pt-2">
                 <button 
                   onClick={() => setConfirmModal(null)}
                   className="flex-1 py-4 bg-white/5 text-muted-text font-black rounded-2xl hover:bg-white/10 hover:text-foreground transition-all uppercase text-[10px] tracking-widest"
                 >
                   Annuler
                 </button>
                 <button 
                   onClick={() => setShowPinModal(true)}
                   className="flex-1 py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                 >
                   Confirmer
                 </button>
               </div>
            </div>
         </div>
      )}

      <PinVerificationModal 
         isOpen={showPinModal} 
         onClose={() => setShowPinModal(false)} 
         onSuccess={executeRepayment} 
         title="Validation requise"
         description="Saisissez votre code PIN pour valider ce remboursement"
      />
    </div>
  );
}
