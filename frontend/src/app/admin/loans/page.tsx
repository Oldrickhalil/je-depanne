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
  Settings,
  LogOut,
  User,
  BellRing
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import PushNotificationPrompt from "@/components/dashboard/PushNotificationPrompt";

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

type SystemSettings = {
  interestRate: number;
  welcomeBonus: number;
  minDeposit: number;
  maintenanceMode: boolean;
};

export default function AdminDashboard() {
  const [view, setView] = useState<'loans' | 'users' | 'withdrawals' | 'settings'>('loans');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSystemSettings] = useState<SystemSettings>({
    interestRate: 0.03,
    welcomeBonus: 80,
    minDeposit: 20,
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKycUser, setSelectedKycUser] = useState<UserType | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, usersRes, transRes, settingsRes] = await Promise.all([
        fetch(`${apiUrl}/api/loans/admin/all`),
        fetch(`${apiUrl}/api/auth/admin/users`),
        fetch(`${apiUrl}/api/activity/admin/transactions`),
        fetch(`${apiUrl}/api/settings`)
      ]);
      const loansData = await loansRes.json();
      const usersData = await usersRes.json();
      const transData = await transRes.json();
      const settingsData = await settingsRes.json();
      
      setLoans(loansData || []);
      setUsers(usersData || []);
      setTransactions(transData || []);
      setSystemSettings(settingsData || {
        interestRate: 0.03,
        welcomeBonus: 80,
        minDeposit: 20,
        maintenanceMode: false
      });
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);
    try {
      const res = await fetch(`${apiUrl}/api/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert("Paramètres mis à jour avec succès !");
      } else {
        alert("Erreur lors de la mise à jour.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingSettings(false);
    }
  };

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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-12 font-sans pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header - Simple and Clean */}
        <div className="flex items-center justify-between mt-2">
           <div className="space-y-1">
              <h1 className="text-3xl font-title font-bold tight-tracking uppercase">
                 Console <span className="text-amber-500">Admin</span>
              </h1>
              <p className="text-[9px] text-muted-text font-black uppercase tracking-[0.3em]">
                {view === 'loans' ? 'Gestion des Prêts' : (view === 'users' ? 'Base Utilisateurs' : (view === 'withdrawals' ? 'Demandes de Retraits' : 'Paramètres Système'))}
              </p>
           </div>

           <button 
             onClick={() => signOut({ callbackUrl: "/login" })}
             className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
           >
              <LogOut size={18} />
           </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "Total Prêté", val: `${loans.filter(l => l.status === 'APPROVED').reduce((acc, curr) => acc + curr.amount, 0)} €`, icon: Zap, color: "text-primary" },
             { label: "Utilisateurs", val: users.length, icon: Users, color: "text-blue-500" },
             { label: "Dépôts Total", val: `${users.reduce((acc, curr) => acc + (curr.wallet?.balance || 0), 0)} €`, icon: Wallet, color: "text-green-500" },
             { label: "Retraits Attente", val: pendingWithdrawals.length, icon: Clock, color: "text-amber-500" }
           ].map((stat, i) => (
             <div key={i} className="bg-card border border-card-border p-5 rounded-[2rem] space-y-3 shadow-sm">
                <stat.icon size={16} className={stat.color} />
                <div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-muted-text">{stat.label}</p>
                   <p className="text-xl font-black tracking-tighter text-foreground">{stat.val}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Content Table */}
        <div className="space-y-6">
           {view !== 'settings' && (
             <div className="relative w-full animate-in fade-in slide-in-from-top-2 duration-500">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={14} />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un dossier..." 
                  className="bg-card border border-card-border rounded-2xl py-4 pl-10 pr-6 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all w-full text-foreground shadow-sm"
                />
             </div>
           )}

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
               ) : view === 'withdrawals' ? (
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
               ) : (
                 /* Settings View */
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-[2.5rem] p-8 space-y-4">
                       <div className="flex items-center gap-3">
                          <BellRing className="text-amber-500" size={20} />
                          <h3 className="font-title font-bold text-lg tracking-widest uppercase text-foreground">Alertes Admin</h3>
                       </div>
                       <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest leading-relaxed">Activez les notifications pour être alerté en temps réel dès qu'un utilisateur effectue un dépôt ou une demande de retrait.</p>
                       <PushNotificationPrompt />
                    </div>

                    <form onSubmit={handleUpdateSettings} className="space-y-6">
                       <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                          <div className="space-y-1 border-b border-card-border pb-6">
                             <h3 className="font-title font-bold text-lg tracking-widest uppercase text-foreground">Configuration Système</h3>
                             <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest">Pilotez les règles de la plateforme</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Taux d'Intérêt (ex: 0.03 pour 3%)</label>
                                <input 
                                   type="number" 
                                   step="0.01"
                                   value={settings.interestRate}
                                   onChange={(e) => setSystemSettings({...settings, interestRate: parseFloat(e.target.value)})}
                                   className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 text-sm font-bold text-foreground focus:outline-none focus:border-amber-500/50 transition-colors shadow-inner"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Bonus de Bienvenue (€)</label>
                                <input 
                                   type="number" 
                                   value={settings.welcomeBonus}
                                   onChange={(e) => setSystemSettings({...settings, welcomeBonus: parseFloat(e.target.value)})}
                                   className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 text-sm font-bold text-foreground focus:outline-none focus:border-amber-500/50 transition-colors shadow-inner"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Dépôt Minimum (€)</label>
                                <input 
                                   type="number" 
                                   value={settings.minDeposit}
                                   onChange={(e) => setSystemSettings({...settings, minDeposit: parseFloat(e.target.value)})}
                                   className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 text-sm font-bold text-foreground focus:outline-none focus:border-amber-500/50 transition-colors shadow-inner"
                                />
                             </div>
                             <div className="flex items-center justify-between p-4 bg-background border border-card-border rounded-2xl shadow-inner">
                                <div>
                                   <p className="text-[10px] font-black text-muted-text uppercase tracking-widest">Mode Maintenance</p>
                                   <p className="text-xs font-bold text-foreground">{settings.maintenanceMode ? 'Activé' : 'Désactivé'}</p>
                                </div>
                                <button 
                                   type="button"
                                   onClick={() => setSystemSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                                   className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-amber-500' : 'bg-gray-700'}`}
                                >
                                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'right-1' : 'left-1'}`}></div>
                                </button>
                             </div>
                          </div>

                          <button 
                             type="submit"
                             disabled={updatingSettings}
                             className="w-full py-5 bg-amber-500 text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                             {updatingSettings ? <Loader2 className="animate-spin" size={18} /> : (
                               <>
                                 Enregistrer les modifications <CheckCircle2 size={18} />
                               </>
                             )}
                          </button>
                       </div>
                    </form>
                 </div>
               )}
             </div>
           )}
        </div>
      </div>

      {/* ULTRA PREMIUM Glass Bottom Nav - Admin Version */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[440px] z-50">
        <nav className="relative bg-[#0c0c0c] backdrop-blur-3xl rounded-[2.5rem] p-2 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden">
          {/* Active indicator background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none"></div>
          
          <button 
            onClick={() => setView('loans')}
            className={`relative p-4 rounded-[1.8rem] transition-all duration-500 group flex flex-col items-center gap-1 ${
              view === 'loans' ? "text-amber-500 bg-white/5 shadow-inner" : "text-gray-500 hover:text-white"
            }`}
          >
            {view === 'loans' && (
              <span className="absolute inset-0 bg-amber-500/10 blur-lg rounded-full"></span>
            )}
            <Zap size={20} className={`relative z-10 transition-transform duration-300 ${view === 'loans' ? "scale-110" : "group-hover:scale-110"}`} fill={view === 'loans' ? 'currentColor' : 'none'} />
            <span className="text-[7px] font-black uppercase tracking-widest relative z-10">Prêts</span>
          </button>

          <button 
            onClick={() => setView('withdrawals')}
            className={`relative p-4 rounded-[1.8rem] transition-all duration-500 group flex flex-col items-center gap-1 ${
              view === 'withdrawals' ? "text-amber-500 bg-white/5 shadow-inner" : "text-gray-500 hover:text-white"
            }`}
          >
            {view === 'withdrawals' && (
              <span className="absolute inset-0 bg-amber-500/10 blur-lg rounded-full"></span>
            )}
            <div className="relative">
               <Banknote size={20} className={`relative z-10 transition-transform duration-300 ${view === 'withdrawals' ? "scale-110" : "group-hover:scale-110"}`} fill={view === 'withdrawals' ? 'currentColor' : 'none'} />
               {pendingWithdrawals.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black shadow-lg border border-[#0c0c0c] z-20">
                     {pendingWithdrawals.length}
                  </span>
               )}
            </div>
            <span className="text-[7px] font-black uppercase tracking-widest relative z-10">Retraits</span>
          </button>

          <button 
            onClick={() => setView('users')}
            className={`relative p-4 rounded-[1.8rem] transition-all duration-500 group flex flex-col items-center gap-1 ${
              view === 'users' ? "text-amber-500 bg-white/5 shadow-inner" : "text-gray-500 hover:text-white"
            }`}
          >
            {view === 'users' && (
              <span className="absolute inset-0 bg-amber-500/10 blur-lg rounded-full"></span>
            )}
            <Users size={20} className={`relative z-10 transition-transform duration-300 ${view === 'users' ? "scale-110" : "group-hover:scale-110"}`} fill={view === 'users' ? 'currentColor' : 'none'} />
            <span className="text-[7px] font-black uppercase tracking-widest relative z-10">Clients</span>
          </button>

          <button 
            onClick={() => setView('settings')}
            className={`relative p-4 rounded-[1.8rem] transition-all duration-500 group flex flex-col items-center gap-1 ${
              view === 'settings' ? "text-amber-500 bg-white/5 shadow-inner" : "text-gray-500 hover:text-white"
            }`}
          >
            {view === 'settings' && (
              <span className="absolute inset-0 bg-amber-500/10 blur-lg rounded-full"></span>
            )}
            <Settings size={20} className={`relative z-10 transition-transform duration-300 ${view === 'settings' ? "scale-110" : "group-hover:scale-110"}`} fill={view === 'settings' ? 'currentColor' : 'none'} />
            <span className="text-[7px] font-black uppercase tracking-widest relative z-10">Réglages</span>
          </button>
        </nav>
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
                  <div className="bg-background p-6 rounded-3xl border border-card-border space-y-4 shadow-inner">
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
               </div>

               <div className="col-span-2 space-y-6">
                  {selectedKycUser.kycAddressProof && (
                     <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={16} className="text-primary" />
                           <p className="text-xs font-black uppercase tracking-widest text-foreground">Justificatif de Domicile</p>
                        </div>
                        <div className="aspect-[21/9] relative rounded-[2rem] overflow-hidden border border-card-border bg-background group shadow-inner">
                           <img src={selectedKycUser.kycAddressProof} alt="Domicile" className="w-full h-full object-cover group-hover:object-contain transition-all duration-300" />
                        </div>
                     </div>
                  )}
                  {selectedKycUser.kycRecto && (
                     <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={16} className="text-primary" />
                           <p className="text-xs font-black uppercase tracking-widest text-foreground">Pièce d'Identité ({selectedKycUser.idType === 'passport' ? 'Page Info' : 'Recto'})</p>
                        </div>
                        <div className="aspect-[16/10] relative rounded-[2rem] overflow-hidden border border-card-border bg-background group shadow-inner">
                           <img src={selectedKycUser.kycRecto} alt="Recto" className="w-full h-full object-cover group-hover:object-contain transition-all duration-300" />
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
                  <div className="bg-background p-4 rounded-2xl border border-card-border shadow-inner">
                     <p className="text-[9px] text-muted-text uppercase tracking-widest font-bold">Montant Demandé</p>
                     <p className="text-2xl font-black text-primary">{selectedLoan.amount} €</p>
                  </div>
                  <div className="bg-background p-4 rounded-2xl border border-card-border shadow-inner">
                     <p className="text-[9px] text-muted-text uppercase tracking-widest font-bold">Durée & Taux</p>
                     <p className="text-lg font-black text-foreground">{selectedLoan.termMonths} mois <span className="text-xs text-muted-text font-medium">@ 3%</span></p>
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
