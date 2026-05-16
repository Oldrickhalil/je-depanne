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
  AlertCircle
} from "lucide-react";
import Link from "next/link";

type User = {
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
  // Nouveaux champs KYC
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
  const [view, setView] = useState<'loans' | 'users'>('loans');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedKycUser, setSelectedKycUser] = useState<User | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, usersRes] = await Promise.all([
        fetch(`${apiUrl}/api/loans/admin/all`),
        fetch(`${apiUrl}/api/auth/admin/users`)
      ]);
      const loansData = await loansRes.json();
      const usersData = await usersRes.json();
      setLoans(loansData);
      setUsers(usersData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans pb-32">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-text hover:text-foreground transition-colors mb-4">
                 <ArrowLeft size={12} /> Dashboard
              </Link>
              <h1 className="text-4xl font-title font-bold tight-tracking uppercase">
                 Admin <span className="text-primary">System</span>
              </h1>
           </div>

           <div className="flex bg-card p-1 rounded-2xl border border-card-border">
              <button 
                onClick={() => setView('loans')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'loans' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-text hover:text-white'}`}
              >
                Prêts
              </button>
              <button 
                onClick={() => setView('users')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'users' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-text hover:text-white'}`}
              >
                Utilisateurs
              </button>
           </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "Total Prêté", val: `${loans.filter(l => l.status === 'APPROVED').reduce((acc, curr) => acc + curr.amount, 0)} €`, icon: Zap, color: "text-primary" },
             { label: "Utilisateurs", val: users.length, icon: Users, color: "text-blue-500" },
             { label: "Dépôts Total", val: `${users.reduce((acc, curr) => acc + (curr.wallet?.balance || 0), 0)} €`, icon: Wallet, color: "text-green-500" },
             { label: "En attente", val: loans.filter(l => l.status === 'PENDING').length, icon: Clock, color: "text-amber-500" }
           ].map((stat, i) => (
             <div key={i} className="bg-card border border-card-border p-6 rounded-[2rem] space-y-3">
                <stat.icon size={16} className={stat.color} />
                <div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-muted-text">{stat.label}</p>
                   <p className="text-2xl font-black tracking-tighter">{stat.val}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Content Table */}
        <div className="space-y-6">
           <div className="flex items-center justify-between border-b border-card-border pb-6 gap-4">
              <h3 className="font-title font-bold text-lg tracking-widest uppercase shrink-0">
                {view === 'loans' ? 'Demandes de Prêts' : 'Base Utilisateurs'}
              </h3>
              <div className="relative w-full max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={14} />
                 <input 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="Rechercher..." 
                   className="bg-card border border-card-border rounded-full py-2.5 pl-10 pr-6 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all w-full"
                 />
              </div>
           </div>

           {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
           ) : (
             <div className="space-y-4">
               {view === 'loans' ? (
                 filteredLoans.map((loan) => (
                   <div key={loan.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2.5rem] bg-card border border-card-border hover:border-primary/10 transition-all gap-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary font-black">
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
                             <button onClick={() => updateLoanStatus(loan.id, 'APPROVED')} className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500 hover:text-foreground transition-all"><CheckCircle2 size={16}/></button>
                             <button onClick={() => updateLoanStatus(loan.id, 'REJECTED')} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-foreground transition-all"><XCircle size={16}/></button>
                           </div>
                         )}
                         <button 
                            onClick={() => setSelectedLoan(loan)}
                            className="px-4 py-2 bg-white/5 text-muted-text text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 hover:text-foreground transition-all"
                         >
                            Détails
                         </button>
                      </div>
                   </div>
                 ))
               ) : (
                 filteredUsers.map((user) => (
                   <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2.5rem] bg-card border border-card-border hover:border-primary/10 transition-all gap-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
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
                               <p className="text-xs font-black">{user.wallet?.balance || 0} €</p>
                            </div>
                            {!user.kycVerified ? (
                              <button 
                                onClick={() => setSelectedKycUser(user)}
                                className="px-4 py-2 bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-500 hover:text-foreground transition-all"
                              >
                                Examiner KYC
                              </button>
                            ) : (
                              <button 
                                onClick={() => setSelectedKycUser(user)}
                                className="px-4 py-2 bg-white/5 text-muted-text text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 hover:text-foreground transition-all"
                              >
                                Voir Docs
                              </button>
                            )}
                         </div>
                      </div>
                   </div>
                 ))
               )}
             </div>
           )}
        </div>
      </div>

      {/* KYC Modal */}
      {selectedKycUser && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-8 relative shadow-2xl">
            <button 
               onClick={() => setSelectedKycUser(null)}
               className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full flex items-center justify-center transition-colors"
            >
              <XCircle size={20} />
            </button>
            
            <div className="space-y-2">
               <h2 className="text-3xl font-black uppercase tracking-tighter">Dossier KYC</h2>
               <p className="text-xs text-muted-text font-bold uppercase tracking-[0.2em]">Client: {selectedKycUser.firstName} {selectedKycUser.lastName} • {selectedKycUser.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="space-y-6">
                  <div className="bg-background p-6 rounded-3xl border border-card-border space-y-4">
                     <p className="text-[9px] font-black uppercase tracking-widest text-muted-text">Informations Déclarées</p>
                     <div>
                        <p className="text-[10px] text-muted-text uppercase tracking-widest">Document</p>
                        <p className="text-base font-bold">{selectedKycUser.idType === 'passport' ? 'Passeport' : 'Carte d\'Identité'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-muted-text uppercase tracking-widest">Date de naissance</p>
                        <p className="text-base font-bold">{selectedKycUser.birthDate ? new Date(selectedKycUser.birthDate).toLocaleDateString('fr-FR') : 'Non renseigné'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-muted-text uppercase tracking-widest">Adresse Déclarée</p>
                        <p className="text-sm font-bold leading-relaxed">{selectedKycUser.address || 'Non renseigné'}</p>
                     </div>
                  </div>

                  {!selectedKycUser.kycVerified && (
                     <button 
                        onClick={() => {
                           updateKycStatus(selectedKycUser.id, true);
                           setSelectedKycUser(null);
                        }}
                        className="w-full py-5 bg-green-500 text-foreground font-black rounded-2xl hover:bg-green-600 transition-all uppercase text-xs tracking-widest shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
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
                        className="w-full py-5 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-2xl hover:bg-red-500 hover:text-foreground transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
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
                           {selectedKycUser.kycAddressProof.startsWith('data:image') ? (
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
                  {!selectedKycUser.kycRecto && !selectedKycUser.kycAddressProof && (
                     <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-card-border rounded-[2rem] text-muted-text gap-4">
                        <AlertCircle size={32} />
                        <span className="text-xs font-bold uppercase tracking-widest">Aucun document uploadé</span>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-8 relative shadow-2xl">
            <button 
               onClick={() => setSelectedLoan(null)}
               className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full flex items-center justify-center transition-colors"
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
                           <p className="text-2xl font-black text-foreground">{(selectedLoan as any).amountRepaid?.toFixed(2) || "0.00"} € <span className="text-sm text-muted-text">/ {(selectedLoan.amount * 1.03).toFixed(2)} €</span></p>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${selectedLoan.status === 'PAID_BACK' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                           {selectedLoan.status === 'PAID_BACK' ? 'Soldé' : 'En cours'}
                        </span>
                     </div>
                     <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${Math.min((((selectedLoan as any).amountRepaid || 0) / (selectedLoan.amount * 1.03)) * 100, 100)}%` }}></div>
                     </div>
                  </div>
               )}

               <div className="bg-background p-6 rounded-3xl border border-card-border space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2"><FileText size={14}/> Informations Complémentaires</p>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2">
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
                        className="flex-1 py-4 bg-green-500 text-foreground font-black rounded-2xl hover:bg-green-600 transition-all uppercase text-xs tracking-widest shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                     >
                        <CheckCircle2 size={18} /> Approuver
                     </button>
                     <button 
                        onClick={async () => {
                           await updateLoanStatus(selectedLoan.id, 'REJECTED');
                           setSelectedLoan(null);
                        }}
                        className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-2xl hover:bg-red-500 hover:text-foreground transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
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
