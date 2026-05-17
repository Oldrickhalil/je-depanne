"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Search, 
  Zap,
  ArrowLeft,
  Loader2,
  Users,
  Wallet,
  FileText,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  LogOut,
  User
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Transaction = {
  id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_DISBURSEMENT' | 'REPAYMENT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  wallet: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      iban?: string;
      bankName?: string;
    };
  };
};

type UserType = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kycVerified: boolean;
  hasDeposited: boolean;
  isInstalled: boolean;
  creditLimit: number;
  wallet: {
    balance: number;
  } | null;
  loans: any[];
  createdAt: string;
  address?: string;
  birthDate?: string;
  idType?: string;
  kycRecto?: string;
  kycVerso?: string;
  kycAddressProof?: string;
};

type Loan = {
  id: string;
  amount: number;
  amountRepaid: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID_BACK';
  createdAt: string;
  termMonths: number;
  maritalStatus?: string;
  employmentStatus?: string;
  monthlyIncome?: number;
  hasExistingCredits?: boolean;
  loanPurpose?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function AdminDashboard() {
  const [view, setView] = useState<'loans' | 'users' | 'withdrawals'>('loans');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedKycUser, setSelectedKycUser] = useState<UserType | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, usersRes, transRes] = await Promise.all([
        fetch(`${apiUrl}/api/loans/admin/all`),
        fetch(`${apiUrl}/api/auth/admin/users`),
        fetch(`${apiUrl}/api/activity/admin/transactions`)
      ]);
      const loansData = await loansRes.json();
      const usersData = await usersRes.json();
      const transData = await transRes.json();
      
      setLoans(loansData);
      setUsers(usersData);
      setTransactions(transData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateTransactionStatus = async (transactionId: string, newStatus: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/activity/admin/transactions/${transactionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Erreur: ${errorData.message}`);
      }
    } catch (err) {
      alert("Erreur mise à jour serveur");
    }
  };

  const updateLoanStatus = async (loanId: string, newStatus: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/loans/${loanId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Erreur: ${errorData.message}`);
      }
    } catch (err) {
      alert("Erreur mise à jour serveur");
    }
  };

  const updateKycStatus = async (userId: string, status: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/users/${userId}/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kycVerified: status }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Erreur KYC");
    }
  };

  const filteredLoans = loans.filter(l => 
    l.user.firstName.toLowerCase().includes(search.toLowerCase()) || 
    l.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.firstName?.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredWithdrawals = transactions.filter(t => 
    t.type === 'WITHDRAWAL' && 
    (t.wallet.user.firstName.toLowerCase().includes(search.toLowerCase()) || 
     t.wallet.user.email.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingWithdrawals = transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'PENDING');

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans pb-32">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-text hover:text-foreground transition-colors mb-4">
                 <ArrowLeft size={12} /> Retour
              </Link>
              <h1 className="text-4xl font-title font-bold tight-tracking uppercase">
                 Console <span className="text-amber-500">Admin</span>
              </h1>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex bg-card p-1 rounded-2xl border border-card-border overflow-x-auto scrollbar-hide">
                <button 
                  onClick={() => setView('loans')}
                  className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${view === 'loans' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-muted-text hover:text-foreground'}`}
                >
                  Prêts
                </button>
                <button 
                  onClick={() => setView('withdrawals')}
                  className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 relative ${view === 'withdrawals' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-muted-text hover:text-foreground'}`}
                >
                  Retraits {pendingWithdrawals.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full animate-pulse font-black">{pendingWithdrawals.length}</span>}
                </button>
                <button 
                  onClick={() => setView('users')}
                  className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${view === 'users' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-muted-text hover:text-foreground'}`}
                >
                  Utilisateurs
                </button>
              </div>

              <button 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shrink-0"
              >
                 <LogOut size={18} />
              </button>
           </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "Total Prêté", val: `${loans.filter(l => l.status === 'APPROVED').reduce((acc, curr) => acc + curr.amount, 0)} €`, icon: Zap, color: "text-primary" },
             { label: "Utilisateurs", val: users.length, icon: Users, color: "text-blue-500" },
             { label: "Dépôts Total", val: `${users.reduce((acc, curr) => acc + (curr.wallet?.balance || 0), 0)} €`, icon: Wallet, color: "text-green-500" },
             { label: "Retraits Attente", val: pendingWithdrawals.length, icon: Clock, color: "text-amber-500" }
           ].map((stat, i) => (
             <div key={i} className="bg-card border border-card-border p-6 rounded-[2rem] space-y-3">
                <stat.icon size={16} className={stat.color} />
                <div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-muted-text">{stat.label}</p>
                   <p className="text-2xl font-black tracking-tighter text-foreground">{stat.val}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Content Table */}
        <div className="space-y-6">
           <div className="flex items-center justify-between border-b border-card-border pb-6 gap-4">
              <h3 className="font-title font-bold text-lg tracking-widest uppercase shrink-0 text-foreground">
                {view === 'loans' ? 'Demandes de Prêts' : (view === 'users' ? 'Base Utilisateurs' : 'Demandes de Retraits')}
              </h3>
              <div className="relative w-full max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={14} />
                 <input 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="Rechercher..." 
                   className="bg-card border border-card-border rounded-full py-2.5 pl-10 pr-6 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all w-full text-foreground"
                 />
              </div>
           </div>

           {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
           ) : (
             <div className="space-y-4">
               {view === 'loans' ? (
                 filteredLoans.length > 0 ? (
                   filteredLoans.map((loan) => (
                     <div key={loan.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2.5rem] bg-card border border-card-border hover:border-primary/10 transition-all gap-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-background border border-card-border flex items-center justify-center text-primary font-black">
                             {loan.amount}
                           </div>
                           <div>
                              <p className="text-sm font-black uppercase tracking-tight text-foreground">{loan.user.firstName}</p>
                              <p className="text-[9px] text-muted-text font-bold uppercase tracking-[0.2em]">{loan.user.email}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                              loan.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                              loan.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                              'bg-red-500/10 text-red-500'
                           }`}>
                              {loan.status}
                           </div>
                           {loan.status === 'PENDING' && (
                             <div className="flex gap-2">
                               <button onClick={() => updateLoanStatus(loan.id, 'APPROVED')} className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"><CheckCircle2 size={16}/></button>
                               <button onClick={() => updateLoanStatus(loan.id, 'REJECTED')} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><XCircle size={16}/></button>
                             </div>
                           )}
                           <button 
                              onClick={() => setSelectedLoan(loan)}
                              className="px-4 py-2 bg-foreground/5 text-muted-text text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 hover:text-foreground transition-all"
                           >
                              Détails
                           </button>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="py-20 text-center text-muted-text uppercase text-[10px] font-black tracking-widest">Aucune demande trouvée</div>
                 )
               ) : view === 'users' ? (
                 filteredUsers.map((user) => (
                   <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2.5rem] bg-card border border-card-border hover:border-primary/10 transition-all gap-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-background border border-card-border flex items-center justify-center">
                            <Users size={18} className="text-muted-text" />
                         </div>
                         <div>
                            <p className="text-sm font-black uppercase tracking-tight text-foreground">{user.firstName} {user.lastName}</p>
                            <p className="text-[9px] text-muted-text font-bold uppercase tracking-[0.2em]">{user.email}</p>
                         </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                         <div className="flex gap-2">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${user.kycVerified ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>KYC</span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${user.hasDeposited ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-muted-text'}`}>Dépôt</span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${user.isInstalled ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-muted-text'}`}>PWA</span>
                         </div>
                         
                         <div className="flex items-center gap-4 pl-4 border-l border-card-border">
                            <div className="text-right">
                               <p className="text-[8px] font-black text-muted-text uppercase">Balance</p>
                               <p className="text-xs font-black text-foreground">{user.wallet?.balance || 0} €</p>
                            </div>
                            <button 
                                onClick={() => setSelectedKycUser(user)}
                                className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${user.kycVerified ? 'bg-foreground/5 text-muted-text hover:bg-white/10 hover:text-foreground' : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white'}`}
                            >
                                {user.kycVerified ? "Voir Docs" : "Examiner KYC"}
                            </button>
                         </div>
                      </div>
                   </div>
                 ))
               ) : (
                 /* Withdrawals View */
                 filteredWithdrawals.length > 0 ? (
                   filteredWithdrawals.map((tx) => (
                    <div key={tx.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2.5rem] bg-card border border-card-border hover:border-primary/10 transition-all gap-6">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-background border border-card-border flex items-center justify-center ${tx.status === 'PENDING' ? 'text-amber-500' : 'text-green-500'}`}>
                             <Banknote size={20} />
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                                <p className="text-sm font-black uppercase tracking-tight text-foreground">{tx.wallet.user.firstName} {tx.wallet.user.lastName}</p>
                                <span className="text-lg font-black text-primary">-{tx.amount}€</span>
                             </div>
                             <p className="text-[9px] text-muted-text font-bold uppercase tracking-[0.2em]">{tx.wallet.user.bankName} • {tx.wallet.user.iban}</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-4">
                          <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                             tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                             tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                             'bg-red-500/10 text-red-500'
                          }`}>
                             {tx.status}
                          </div>
                          {tx.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button onClick={() => updateTransactionStatus(tx.id, 'COMPLETED')} className="px-4 py-2 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/20">Valider</button>
                              <button onClick={() => updateTransactionStatus(tx.id, 'FAILED')} className="px-4 py-2 bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500 hover:text-white transition-all">Refuser</button>
                            </div>
                          )}
                          <p className="text-[9px] text-muted-text font-bold uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</p>
                       </div>
                    </div>
                  ))
                 ) : (
                   <div className="py-20 text-center text-muted-text uppercase text-[10px] font-black tracking-widest">Aucun retrait trouvé</div>
                 )
               )}
             </div>
           )}
        </div>
      </div>

      {/* KYC Modal */}
      {selectedKycUser && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4 h-[100dvh] w-screen">
          <div className="bg-card border border-card-border rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-8 relative shadow-2xl animate-in zoom-in-95 duration-500">
            <button 
               onClick={() => setSelectedKycUser(null)}
               className="absolute top-6 right-6 w-10 h-10 bg-foreground/5 hover:bg-red-500/20 hover:text-red-500 rounded-full flex items-center justify-center transition-colors"
            >
              <XCircle size={20} />
            </button>
            
            <div className="space-y-2">
               <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Dossier KYC</h2>
               <p className="text-xs text-muted-text font-bold uppercase tracking-[0.2em]">Client: {selectedKycUser.firstName} {selectedKycUser.lastName} • {selectedKycUser.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="space-y-6">
                  <div className="bg-background p-6 rounded-3xl border border-card-border space-y-4">
                     <p className="text-[9px] font-black uppercase tracking-widest text-muted-text">Informations Déclarées</p>
                     <div>
                        <p className="text-[10px] text-muted-text uppercase tracking-widest">Document</p>
                        <p className="text-base font-bold text-foreground">{selectedKycUser.idType === 'passport' ? 'Passeport' : 'Carte d\'Identité'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-muted-text uppercase tracking-widest">Date de naissance</p>
                        <p className="text-base font-bold text-foreground">{selectedKycUser.birthDate ? new Date(selectedKycUser.birthDate).toLocaleDateString('fr-FR') : 'Non renseigné'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-muted-text uppercase tracking-widest">Adresse Déclarée</p>
                        <p className="text-sm font-bold leading-relaxed text-foreground">{selectedKycUser.address || 'Non renseigné'}</p>
                     </div>
                  </div>

                  {!selectedKycUser.kycVerified && (
                     <button 
                        onClick={() => {
                           updateKycStatus(selectedKycUser.id, true);
                           setSelectedKycUser(null);
                        }}
                        className="w-full py-5 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition-all uppercase text-xs tracking-widest shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                     >
                        <CheckCircle2 size={20} /> Approuver le dossier
                     </button>
                  )}
                  {selectedKycUser.kycVerified && (
                     <button 
                        onClick={() => {
                           updateKycStatus(selectedKycUser.id, false);
                           setSelectedKycUser(null);
                        }}
                        className="w-full py-5 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                     >
                        <XCircle size={20} /> Révoquer le statut
                     </button>
                  )}
               </div>

               <div className="col-span-2 space-y-6">
                  {selectedKycUser.kycAddressProof && (
                     <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={16} className="text-primary" />
                           <p className="text-xs font-black uppercase tracking-widest text-foreground">Justificatif de Domicile</p>
                        </div>
                        <div className="aspect-[21/9] relative rounded-[2rem] overflow-hidden border border-card-border bg-background group">
                           {selectedKycUser.kycAddressProof.startsWith('data:image') || selectedKycUser.kycAddressProof.startsWith('http') ? (
                              <img src={selectedKycUser.kycAddressProof} alt="Domicile" className="w-full h-full object-cover group-hover:object-contain transition-all duration-300" />
                           ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-text">
                                 <FileText size={32} />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Document PDF / Autre</span>
                              </div>
                           )}
                        </div>
                     </div>
                  )}
                  {selectedKycUser.kycRecto && (
                     <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={16} className="text-primary" />
                           <p className="text-xs font-black uppercase tracking-widest text-foreground">Pièce d'Identité ({selectedKycUser.idType === 'passport' ? 'Page Info' : 'Recto'})</p>
                        </div>
                        <div className="aspect-[16/10] relative rounded-[2rem] overflow-hidden border border-card-border bg-background group">
                           <img src={selectedKycUser.kycRecto} alt="Recto" className="w-full h-full object-cover group-hover:object-contain transition-all duration-300" />
                        </div>
                     </div>
                  )}
                  {selectedKycUser.kycVerso && (
                     <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={16} className="text-primary" />
                           <p className="text-xs font-black uppercase tracking-widest text-foreground">Pièce d'Identité (Verso)</p>
                        </div>
                        <div className="aspect-[16/10] relative rounded-[2rem] overflow-hidden border border-card-border bg-background group">
                           <img src={selectedKycUser.kycVerso} alt="Verso" className="w-full h-full object-cover group-hover:object-contain transition-all duration-300" />
                        </div>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4 h-[100dvh] w-screen">
          <div className="bg-card border border-card-border rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-8 relative shadow-2xl animate-in zoom-in-95 duration-500">
            <button 
               onClick={() => setSelectedLoan(null)}
               className="absolute top-6 right-6 w-10 h-10 bg-foreground/5 hover:bg-red-500/20 hover:text-red-500 rounded-full flex items-center justify-center transition-colors"
            >
              <XCircle size={20} />
            </button>
            
            <div className="space-y-2 border-b border-card-border pb-6">
               <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Détails du Prêt</h2>
               <p className="text-xs text-muted-text font-bold uppercase tracking-[0.2em]">Client: {selectedLoan.user.firstName} {selectedLoan.user.lastName} • {selectedLoan.user.email}</p>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background p-4 rounded-2xl border border-card-border">
                     <p className="text-[9px] text-muted-text uppercase tracking-widest font-bold">Montant Demandé</p>
                     <p className="text-2xl font-black text-primary">{selectedLoan.amount} €</p>
                  </div>
                  <div className="bg-background p-4 rounded-2xl border border-card-border">
                     <p className="text-[9px] text-muted-text uppercase tracking-widest font-bold">Durée & Taux</p>
                     <p className="text-lg font-black text-foreground">{selectedLoan.termMonths} mois <span className="text-xs text-muted-text font-medium">@ 3%</span></p>
                  </div>
               </div>

               {(selectedLoan.status === 'APPROVED' || selectedLoan.status === 'PAID_BACK') && (
                  <div className="bg-background p-6 rounded-3xl border border-card-border space-y-4">
                     <div className="flex justify-between items-end">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">Remboursement</p>
                           <p className="text-2xl font-black text-foreground">{selectedLoan.amountRepaid?.toFixed(2) || "0.00"} € <span className="text-sm text-muted-text">/ {(selectedLoan.amount * 1.03).toFixed(2)} €</span></p>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${selectedLoan.status === 'PAID_BACK' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                           {selectedLoan.status === 'PAID_BACK' ? 'Soldé' : 'En cours'}
                        </span>
                     </div>
                     <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${Math.min(((selectedLoan.amountRepaid || 0) / (selectedLoan.amount * 1.03)) * 100, 100)}%` }}></div>
                     </div>
                  </div>
               )}

               <div className="bg-background p-6 rounded-3xl border border-card-border space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2"><FileText size={14}/> Informations Complémentaires</p>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-left">
                     <div>
                        <p className="text-[9px] text-muted-text uppercase tracking-widest">État Civil</p>
                        <p className="text-sm font-bold text-foreground capitalize">{selectedLoan.maritalStatus === 'single' ? 'Célibataire' : selectedLoan.maritalStatus === 'married' ? 'Marié(e) / Pacsé(e)' : selectedLoan.maritalStatus === 'divorced' ? 'Divorcé(e)' : selectedLoan.maritalStatus === 'widowed' ? 'Veuf/Veuve' : 'Non renseigné'}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-muted-text uppercase tracking-widest">Situation Pro.</p>
                        <p className="text-sm font-bold text-foreground capitalize">{selectedLoan.employmentStatus === 'employed' ? 'Salarié(e)' : selectedLoan.employmentStatus === 'self_employed' ? 'Indépendant(e)' : selectedLoan.employmentStatus === 'unemployed' ? 'Sans emploi' : selectedLoan.employmentStatus === 'student' ? 'Étudiant(e)' : selectedLoan.employmentStatus === 'retired' ? 'Retraité(e)' : 'Non renseigné'}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-muted-text uppercase tracking-widest">Revenus Mensuels</p>
                        <p className="text-sm font-bold text-foreground">{selectedLoan.monthlyIncome ? `${selectedLoan.monthlyIncome} €` : 'Non renseigné'}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-muted-text uppercase tracking-widest">Crédits en cours</p>
                        <p className="text-sm font-bold text-foreground">{selectedLoan.hasExistingCredits ? 'Oui' : 'Non'}</p>
                     </div>
                     <div className="col-span-2">
                        <p className="text-[9px] text-muted-text uppercase tracking-widest">Motif du prêt</p>
                        <p className="text-sm font-bold text-foreground capitalize">{selectedLoan.loanPurpose === 'emergency' ? 'Urgence' : selectedLoan.loanPurpose === 'purchase' ? 'Achat / Consommation' : selectedLoan.loanPurpose === 'travel' ? 'Voyage' : selectedLoan.loanPurpose === 'auto' ? 'Réparation Auto' : selectedLoan.loanPurpose === 'other' ? 'Autre' : 'Non renseigné'}</p>
                     </div>
                  </div>
               </div>

               {selectedLoan.status === 'PENDING' && (
                  <div className="flex gap-4 pt-4 border-t border-card-border">
                     <button 
                        onClick={async () => {
                           await updateLoanStatus(selectedLoan.id, 'APPROVED');
                           setSelectedLoan(null);
                        }}
                        className="flex-1 py-4 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition-all uppercase text-xs tracking-widest shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                     >
                        <CheckCircle2 size={18} /> Approuver
                     </button>
                     <button 
                        onClick={async () => {
                           await updateLoanStatus(selectedLoan.id, 'REJECTED');
                           setSelectedLoan(null);
                        }}
                        className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                     >
                        <XCircle size={18} /> Rejeter
                     </button>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
