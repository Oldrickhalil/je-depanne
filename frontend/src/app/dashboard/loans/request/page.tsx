"use client";

import { useState, useEffect } from "react";
import { 
  Zap, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Briefcase,
  Wallet,
  Users,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

type Step = "simulate" | "infos" | "confirm";

export default function LoanRequestPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<Step>("simulate");
  const [amount, setAmount] = useState(150);
  const [duration, setDuration] = useState(3);
  const [interest, setInterest] = useState(0);
  const [totalRepayment, setTotalRepayment] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nouveaux champs d'informations supplémentaires
  const [formData, setFormData] = useState({
    maritalStatus: "single", // single, married, divorced
    employmentStatus: "employed", // employed, self_employed, unemployed, student
    monthlyIncome: "",
    hasExistingCredits: "false", // "true" or "false"
    loanPurpose: "emergency" // emergency, purchase, travel, other
  });

  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam === "confirm") setStep("confirm");
  }, [searchParams]);

  useEffect(() => {
    const rate = 0.03;
    const calculatedInterest = amount * rate;
    setInterest(calculatedInterest);
    setTotalRepayment(amount + calculatedInterest);
  }, [amount, duration]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoanSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.monthlyIncome) {
        setError("Veuillez indiquer vos revenus mensuels.");
        return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const userId = (session?.user as any)?.id;

      if (!userId) throw new Error("Veuillez vous reconnecter.");

      const loanRes = await fetch(`${apiUrl}/api/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId, 
            amount, 
            termMonths: duration,
            maritalStatus: formData.maritalStatus,
            employmentStatus: formData.employmentStatus,
            monthlyIncome: parseFloat(formData.monthlyIncome),
            hasExistingCredits: formData.hasExistingCredits === "true",
            loanPurpose: formData.loanPurpose
        })
      });

      if (!loanRes.ok) {
          const loanData = await loanRes.json();
          throw new Error(loanData.message || "Erreur lors de la création du prêt.");
      }
      
      setStep("confirm");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-sans">
      <div className="flex items-center gap-4">
        {step !== "simulate" && (step !== "confirm") && (
          <button 
            onClick={() => setStep("simulate")}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-title font-bold tight-tracking uppercase">
            Demande de <span className="text-primary">Prêt</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">
            {step === "simulate" && "Étape 1: Simulation"}
            {step === "infos" && "Étape 2: Informations Complémentaires"}
            {step === "confirm" && "Étape 3: Confirmation"}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
           <AlertCircle size={20} className="shrink-0 mt-0.5" />
           <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest">Attention</p>
              <p className="text-[10px] font-medium opacity-80 uppercase tracking-tight">{error}</p>
           </div>
        </div>
      )}

      <div className="dark-card rounded-[3rem] p-8 md:p-12 relative overflow-hidden border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>

        {step === "simulate" && (
          <div className="space-y-10 relative z-10">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">Montant souhaité</label>
                <span className="text-4xl font-black tracking-tighter text-primary uppercase">{amount} €</span>
              </div>
              <input 
                type="range" 
                min="100" 
                max="10000" 
                step="100"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                <span>100 €</span>
                <span>Max 10 000 €</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-[2rem] border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Durée du prêt</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[3, 6, 12, 24, 36, 48, 60].map((d) => (
                    <button 
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-4 py-3 rounded-xl font-bold text-[10px] transition-all ${duration === d ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                      {d >= 12 ? `${d/12} an${d/12 > 1 ? 's' : ''}` : `${d} mois`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass p-6 rounded-[2rem] border-white/5 space-y-2 bg-primary/5">
                <div className="flex items-center gap-2 text-primary/70">
                  <Zap size={14} fill="currentColor" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Résumé des frais</span>
                </div>
                <div className="space-y-1">
                   <div className="flex justify-between text-[10px] font-medium text-gray-400 uppercase tracking-tight">
                      <span>Intérêts (5%)</span>
                      <span className="text-white font-bold">{interest.toFixed(2)} €</span>
                   </div>
                   <div className="flex justify-between text-sm font-black text-white uppercase tracking-tighter pt-1 border-t border-white/5">
                      <span>Total à rembourser</span>
                      <span className="text-primary">{totalRepayment.toFixed(2)} €</span>
                   </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setStep("infos")}
              className="w-full py-5 rounded-[2rem] bg-primary text-white font-black text-[12px] uppercase tracking-[0.3em] shadow-lg shadow-primary/20 glow-primary active:scale-[0.98] transition-all flex items-center justify-center gap-4"
            >
              Continuer vers ma demande
              <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
        )}

        {step === "infos" && (
          <form onSubmit={handleLoanSubmission} className="space-y-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                 <ShieldCheck size={24} />
              </div>
              <div>
                 <h3 className="text-xl font-black uppercase tracking-tight text-white">Analyse Rapide</h3>
                 <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em]">Compte déjà activé, complétez juste ceci</p>
              </div>
            </div>

            <div className="space-y-8">
              
              {/* Situation Personnelle */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-gray-400 border-b border-white/5 pb-2">
                    <Users size={14} />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Situation Personnelle</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-2">État Civil</label>
                       <select 
                         name="maritalStatus"
                         value={formData.maritalStatus}
                         onChange={handleInputChange}
                         className="w-full px-5 py-4 bg-[#121212] border border-[#252525] text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-bold uppercase text-[10px] tracking-widest appearance-none cursor-pointer"
                       >
                         <option value="single">Célibataire</option>
                         <option value="married">Marié(e) / Pacsé(e)</option>
                         <option value="divorced">Divorcé(e)</option>
                         <option value="widowed">Veuf / Veuve</option>
                       </select>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-2">Motif du prêt</label>
                       <select 
                         name="loanPurpose"
                         value={formData.loanPurpose}
                         onChange={handleInputChange}
                         className="w-full px-5 py-4 bg-[#121212] border border-[#252525] text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-bold uppercase text-[10px] tracking-widest appearance-none cursor-pointer"
                       >
                         <option value="emergency">Urgence</option>
                         <option value="purchase">Achat / Consommation</option>
                         <option value="travel">Voyage</option>
                         <option value="auto">Réparation Auto</option>
                         <option value="other">Autre</option>
                       </select>
                    </div>
                 </div>
              </div>

              {/* Revenus et Emploi */}
              <div className="space-y-4 pt-2">
                 <div className="flex items-center gap-2 text-gray-400 border-b border-white/5 pb-2">
                    <Briefcase size={14} />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Revenus & Emploi</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-2">Situation Pro.</label>
                       <select 
                         name="employmentStatus"
                         value={formData.employmentStatus}
                         onChange={handleInputChange}
                         className="w-full px-5 py-4 bg-[#121212] border border-[#252525] text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-bold uppercase text-[10px] tracking-widest appearance-none cursor-pointer"
                       >
                         <option value="employed">Salarié(e)</option>
                         <option value="self_employed">Indépendant(e)</option>
                         <option value="unemployed">Sans emploi</option>
                         <option value="student">Étudiant(e)</option>
                         <option value="retired">Retraité(e)</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-2">
                         {formData.employmentStatus === 'unemployed' || formData.employmentStatus === 'student' ? 'Revenus totaux (Aides, etc.)' : 'Salaire Net Mensuel'}
                       </label>
                       <div className="relative">
                          <input 
                            type="number"
                            name="monthlyIncome"
                            required
                            min="0"
                            placeholder="Ex: 2500"
                            value={formData.monthlyIncome}
                            onChange={handleInputChange}
                            className="w-full px-5 py-4 bg-[#121212] border border-[#252525] text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-gray-600 font-bold text-[12px] tracking-widest pr-10"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Endettement */}
              <div className="space-y-4 pt-2">
                 <div className="flex items-center gap-2 text-gray-400 border-b border-white/5 pb-2">
                    <CreditCard size={14} />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Endettement Actuel</p>
                 </div>

                 <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-2">Avez-vous des crédits en cours ?</label>
                     <div className="flex gap-4">
                        <label className="flex-1 flex items-center justify-center gap-3 px-5 py-4 bg-[#121212] border border-[#252525] rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                           <input 
                              type="radio" 
                              name="hasExistingCredits" 
                              value="false" 
                              checked={formData.hasExistingCredits === "false"}
                              onChange={handleInputChange}
                              className="accent-primary w-4 h-4"
                           />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-white">Non, aucun</span>
                        </label>
                        <label className="flex-1 flex items-center justify-center gap-3 px-5 py-4 bg-[#121212] border border-[#252525] rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                           <input 
                              type="radio" 
                              name="hasExistingCredits" 
                              value="true" 
                              checked={formData.hasExistingCredits === "true"}
                              onChange={handleInputChange}
                              className="accent-primary w-4 h-4"
                           />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-white">Oui</span>
                        </label>
                     </div>
                 </div>
              </div>

            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-[2rem] bg-white text-black font-black text-[12px] uppercase tracking-[0.3em] hover:bg-gray-200 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Soumettre ma demande
                  <ChevronRight size={18} strokeWidth={3} />
                </>
              )}
            </button>
          </form>
        )}

        {step === "confirm" && (
          <div className="space-y-10 relative z-10 text-center py-4">
             <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary blur-2xl opacity-20 animate-pulse"></div>
                <CheckCircle2 size={80} className="text-primary relative z-10" />
             </div>
             
             <div className="space-y-3">
                <h3 className="text-3xl font-black tracking-tighter uppercase text-white">Demande Reçue !</h3>
                <p className="text-gray-400 text-[10px] font-bold max-w-sm mx-auto uppercase tracking-[0.2em] leading-relaxed">
                   Vos informations ont été soumises avec succès. L'analyse instantanée est en cours.
                </p>
             </div>

             <div className="glass p-6 rounded-[2rem] max-w-xs mx-auto border-white/10 space-y-4">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-500">
                   <span>Montant Prêt</span>
                   <span className="text-primary font-black text-sm">{amount} €</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-500">
                   <span>Durée</span>
                   <span className="text-white font-bold">{duration >= 12 ? `${duration/12} an(s)` : `${duration} mois`}</span>
                </div>
             </div>

             <Link 
               href="/dashboard/loans"
               className="inline-block w-full py-5 rounded-[2rem] bg-primary text-white font-black text-[12px] uppercase tracking-[0.3em] shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
             >
               Voir mes prêts
             </Link>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 text-gray-600">
         <ShieldCheck size={16} />
         <p className="text-[10px] font-black uppercase tracking-[0.3em]">Propulsé par le moteur de décision Je Dépanne</p>
      </div>
    </div>
  );
}