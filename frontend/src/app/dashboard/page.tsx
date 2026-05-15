"use client";

import { useSession } from "next-auth/react";
import { 
  Zap, 
  PieChart, 
  ShieldCheck, 
  Info, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import OnboardingIntro from "@/components/dashboard/OnboardingIntro";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [freshStatus, setFreshStatus] = useState<any>(null);
  const [showActivationModal, setShowActivationModal] = useState<{show: boolean, action: string}>({show: false, action: ""});
  
  const firstName = session?.user?.name?.split(" ")[0] || "Client";

  // Récupérer le statut réel en base de données pour assurer le dynamisme
  useEffect(() => {
    const fetchStatus = async () => {
      const userId = (session?.user as any)?.id;
      if (!userId) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/auth/status/${userId}`);
        const data = await res.json();
        setFreshStatus(data);

        // Mettre à jour la session si discordance (onboarding fini par exemple)
        const user = session?.user as any;
        if (data.kycVerified !== user.kycVerified || data.hasDeposited !== user.hasDeposited || data.isInstalled !== user.isInstalled) {
           await updateSession({
             ...session,
             user: {
               ...session?.user,
               kycVerified: data.kycVerified,
               hasDeposited: data.hasDeposited,
               isInstalled: data.isInstalled,
               creditLimit: data.creditLimit
             }
           });
        }

        // Logique d'affichage de l'intro : seulement si rien n'est fait
        if (!data.kycVerified && !data.hasDeposited && !data.isInstalled) {
          const introSeen = sessionStorage.getItem("jd_onboarding_seen");
          if (!introSeen) {
            setShowIntro(true);
          }
        } else {
          setShowIntro(false);
        }
      } catch (err) {
        console.error("Erreur récupération statut:", err);
      }
    };

    if (session) fetchStatus();
  }, [session, updateSession]);

  useEffect(() => {
    const fetchUserLoans = async () => {
      const userId = (session?.user as any)?.id;
      if (!userId) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/loans/user/${userId}`);
        const data = await res.json();
        setLoans(data);
      } catch (err) {
        console.error("Erreur récupération prêts:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchUserLoans();
  }, [session]);

  const activeLoan = loans.length > 0 ? loans[0] : null;
  const hasObtainedCredit = loans.some(l => l.status === 'APPROVED' || l.status === 'PAID_BACK');
  const isActivated = freshStatus ? (freshStatus.kycVerified && freshStatus.hasDeposited && freshStatus.isInstalled) : false;

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "En cours d'analyse", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock };
      case "APPROVED":
        return { label: "Approuvé", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2 };
      case "REJECTED":
        return { label: "Refusé", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle };
      case "PAID_BACK":
        return { label: "Remboursé", color: "text-blue-500", bg: "bg-blue-500/10", icon: CheckCircle2 };
      default:
        return { label: "Aucun prêt", color: "text-gray-500", bg: "bg-gray-500/10", icon: Info };
    }
  };

  const status = getStatusDisplay(activeLoan?.status || "NONE");
  const StatusIcon = status.icon;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {showIntro && <OnboardingIntro />}
      
      <OnboardingChecklist freshStatus={freshStatus} />
      
      {/* Focused Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none">
            Bienvenue, <span className="text-primary">{firstName}</span>
          </h1>
        </div>
      </section>

      {/* Main Loan Focus: Balance & Action */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 relative group">
          <div className="absolute -inset-4 bg-primary/20 blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
          
          <div className="relative overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl bg-[#111111]">
             <div className="absolute inset-0 premium-gradient opacity-90"></div>
             
             <div className="relative p-10 flex flex-col h-72 justify-between">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.1em]">Solde Disponible</p>
                      <div className="flex items-baseline gap-2">
                         <span className="text-2xl font-light text-white/70">€</span>
                         <h2 className="text-6xl font-black tracking-tighter">
                            {freshStatus ? freshStatus.balance.toFixed(2) : "0.00"}
                         </h2>
                      </div>
                   </div>
                   <Image src="/images/logo-jd-bw.svg" alt="JD" width={50} height={30} className="opacity-90" />
                </div>

                <div className="flex flex-col gap-4 mt-auto">
                   <div className="flex justify-between items-center">
                      <p className="text-white/40 font-mono text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase tracking-tighter">
                        ID: JD-{(session?.user as any)?.id?.slice(0, 8).toUpperCase() || "XXXXXXX"}
                      </p>
                      {isActivated && (
                        <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-2 border-green-500/20 bg-green-500/10">
                           <ShieldCheck size={12} className="text-green-500" />
                           <span className="text-[9px] font-black tracking-widest uppercase text-green-500">Activé</span>
                        </div>
                      )}
                   </div>
                   <div className="flex gap-3">
                      <Link 
                        href="/dashboard/deposit"
                        className="flex-1 text-center py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:opacity-90 transition-all active:scale-95"
                      >
                         Déposer
                      </Link>
                      <button 
                         onClick={() => {
                            if (!isActivated) setShowActivationModal({show: true, action: "retirer"});
                            else if (!hasObtainedCredit) setShowActivationModal({show: true, action: "no_credit"});
                            else router.push("/dashboard/withdraw");
                         }}
                         className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-gray-200 transition-all active:scale-95"
                      >
                         Retirer
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Loan Status Tracking (Dynamic) */}
        <div className="dark-card rounded-[3rem] p-8 flex flex-col gap-6 bg-[#0c0c0c] border-white/5">
           <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500">État de ma demande</h3>
              <Info size={16} className="text-gray-700" />
           </div>
           
           <div className="flex-1 flex flex-col justify-center items-center text-center space-y-5 px-2">
              {loading ? (
                <Loader2 className="animate-spin text-primary" size={32} />
              ) : (
                <>
                  <div className={`w-20 h-20 rounded-[2rem] ${status.bg} flex items-center justify-center border border-white/5 relative`}>
                    <div className={`absolute inset-0 ${status.bg} blur-xl opacity-50`}></div>
                    <StatusIcon size={32} className={status.color} />
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs font-black uppercase tracking-widest ${status.color}`}>{status.label}</p>
                    {activeLoan && (
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            Demande <span className="text-white">#{activeLoan.id.slice(0, 5).toUpperCase()}</span> • {activeLoan.amount} €
                        </p>
                    )}
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${activeLoan?.status === 'PENDING' ? 'w-1/2 bg-amber-500 animate-pulse' : activeLoan?.status === 'APPROVED' ? 'w-full bg-green-500' : 'w-0'} rounded-full`}></div>
                  </div>
                </>
              )}
           </div>

           <button 
              onClick={() => !isActivated ? setShowActivationModal({show: true, action: "demande"}) : router.push("/dashboard/loans/request")}
              className="w-full py-5 rounded-[1.8rem] bg-white/5 border border-white/5 text-white font-black text-[11px] uppercase tracking-[0.05em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
           >
              <Zap size={16} className="text-primary" fill="currentColor" />
              Nouvelle demande
           </button>
        </div>
      </section>

      {/* Loan History & Credit Analysis */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8">
           <div className="flex justify-between items-end">
              <div className="space-y-1">
                 <h3 className="font-title font-bold text-lg tracking-wider uppercase">Historique des Prêts</h3>
                 <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Suivi de vos remboursements</p>
              </div>
           </div>

           <div className="space-y-3">
              {loans.length > 0 ? (
                loans.slice(0, 3).map((loan) => (
                    <div key={loan.id} className="group flex items-center justify-between p-6 rounded-[2rem] bg-[#0c0c0c] border border-white/5 hover:border-primary/20 transition-all duration-500">
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl ${getStatusDisplay(loan.status).bg} ${getStatusDisplay(loan.status).color} flex items-center justify-center`}>
                                {loan.status === 'PENDING' ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-tight text-white">Prêt Instantané</p>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.05em]">{getStatusDisplay(loan.status).label} • {new Date(loan.createdAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                        <p className="text-sm font-black tracking-tighter text-white">
                            {loan.amount} €
                        </p>
                    </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-12 rounded-[2rem] bg-[#0c0c0c] border border-white/5 border-dashed">
                   <p className="text-[10px] text-gray-600 font-black uppercase tracking-wider text-center">Aucune demande enregistrée.</p>
                </div>
              )}
              {loans.length > 3 && (
                <Link href="/dashboard/loans" className="block text-center text-[9px] font-black uppercase tracking-wider text-primary hover:underline">
                  Voir tout l'historique
                </Link>
              )}
           </div>
        </div>

        <div className="space-y-8">
           <div className="space-y-1">
              <h3 className="font-title font-bold text-lg tracking-wider uppercase">Score de Confiance</h3>
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Capacité d'emprunt</p>
           </div>
           
           <div className="p-10 rounded-[3rem] bg-gradient-to-br from-[#0c0c0c] to-[#070707] border border-white/5 relative overflow-hidden group">
              <div className="relative flex flex-col justify-between items-center text-center space-y-6">
                 <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin-slow"></div>
                    <PieChart size={32} className="text-primary" />
                 </div>
                 
                 <div className="space-y-2">
                    <h4 className="text-2xl font-black tracking-tighter uppercase">Niveau 1</h4>
                    <p className="text-[10px] text-gray-500 font-medium max-w-[240px] leading-relaxed mx-auto uppercase tracking-widest">
                       Remboursez vos premiers prêts pour débloquer des montants plus élevés.
                    </p>
                 </div>

                 <div className="w-full space-y-3">
                    <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-widest text-gray-600">
                       <span>Score Actuel</span>
                       <span className="text-primary">100 / 1000</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                       <div className="bg-primary h-full w-[10%] rounded-full shadow-[0_0_10px_rgba(81,32,179,0.5)]"></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Activation Modal */}
      {showActivationModal.show && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
               onClick={() => setShowActivationModal({show: false, action: ""})}
               className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              <XCircle size={20} />
            </button>
            
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-2 mx-auto">
              <ShieldCheck className="w-8 h-8 text-amber-500" />
            </div>

            <div className="text-center space-y-2">
               <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Action bloquée</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                 {showActivationModal.action === "no_credit" 
                   ? "Vous devez avoir obtenu au moins un crédit pour débloquer la fonctionnalité de retrait."
                   : `Vous devez activer votre compte pour ${showActivationModal.action === "retirer" ? "effectuer un retrait" : "faire une demande de prêt"}.`
                 }
               </p>
            </div>

            <div className="bg-[#161616] p-4 rounded-2xl border border-white/5 space-y-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Prochaine étape requise</p>
              <p className="text-sm font-bold text-white uppercase tracking-tight">
                {showActivationModal.action === "no_credit" 
                  ? "Faire une demande de prêt"
                  : (!freshStatus?.kycVerified ? "Vérifier votre identité" : (!freshStatus?.hasDeposited ? "Effectuer votre premier dépôt" : "Ajouter à l'écran d'accueil"))
                }
              </p>
            </div>

            <button 
              onClick={() => {
                setShowActivationModal({show: false, action: ""});
                if (showActivationModal.action === "no_credit") {
                  router.push("/dashboard/loans/request");
                } else {
                  router.push(!freshStatus?.kycVerified ? "/dashboard/onboarding/kyc" : (!freshStatus?.hasDeposited ? "/dashboard/onboarding/deposit" : "/dashboard/onboarding/pwa"));
                }
              }}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
            >
              {showActivationModal.action === "no_credit" ? "Aller à la demande" : "Continuer l'activation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
