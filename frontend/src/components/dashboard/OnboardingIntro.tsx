"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ShieldCheck, 
  Wallet, 
  Smartphone, 
  ChevronRight, 
  CheckCircle2,
  ArrowRight,
  Zap
} from "lucide-react";

export default function OnboardingIntro() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const user = session?.user as any;

  // Onboarding steps data
  const steps = [
    {
      title: "Bienvenue sur Je Dépanne",
      description: "Votre solution premium de micro-crédit instantané. Configurons votre compte en quelques secondes.",
      icon: Zap,
      color: "text-primary",
      bg: "bg-primary/10",
      button: "C'est parti"
    },
    {
      title: "Vérifiez votre identité",
      description: "Une étape rapide pour sécuriser vos transactions et débloquer l'accès au crédit.",
      icon: ShieldCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      button: "Vérifier maintenant",
      action: () => router.push("/dashboard/onboarding/kyc")
    },
    {
      title: "Premier Dépôt",
      description: "Alimentez votre compte de 20€ pour activer votre première limite de crédit de 80€.",
      icon: Wallet,
      color: "text-green-500",
      bg: "bg-green-500/10",
      button: "Alimenter",
      action: () => router.push("/dashboard/onboarding/deposit")
    },
    {
      title: "Accès Rapide",
      description: "Ajoutez l'application à votre écran d'accueil pour une expérience optimale.",
      icon: Smartphone,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      button: "Installer",
      action: () => router.push("/dashboard/onboarding/pwa")
    }
  ];

  const next = () => {
    if (steps[currentStep].action) {
      if (user?.id) localStorage.setItem(`jd_onboarding_seen_${user.id}`, "true");
      steps[currentStep].action!();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const skip = () => {
    if (user?.id) localStorage.setItem(`jd_onboarding_seen_${user.id}`, "true");
    router.push("/dashboard");
    // Force re-render of parent to hide intro
    window.location.reload();
  };

  if (!session) return null;

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-[999] h-[100dvh] w-screen bg-background flex flex-col items-center justify-center p-6 text-foreground font-sans overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-md space-y-12 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Progress Bar */}
        <div className="flex gap-2 px-4">
           {steps.map((_, i) => (
             <div 
               key={i} 
               className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-primary' : 'bg-white/10'}`}
             ></div>
           ))}
        </div>

        <div className="flex flex-col items-center text-center space-y-8">
           <div className={`w-24 h-24 rounded-[2.5rem] ${steps[currentStep].bg} flex items-center justify-center border border-card-border animate-bounce-slow`}>
              <StepIcon className={`w-12 h-12 ${steps[currentStep].color}`} />
           </div>

           <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tighter uppercase leading-[0.9] tight-tracking">
                 {steps[currentStep].title}
              </h1>
              <p className="text-muted-text text-lg font-medium leading-relaxed px-4">
                 {steps[currentStep].description}
              </p>
           </div>
        </div>

        <div className="pt-8 px-4">
           <button 
             onClick={next}
             className="w-full py-5 bg-white text-black font-black text-lg rounded-3xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-white/5"
           >
              {steps[currentStep].button}
              <ArrowRight size={20} />
           </button>
           
           <button 
             onClick={skip}
             className="w-full py-4 text-muted-text font-bold text-xs uppercase tracking-[0.2em] mt-4 hover:text-foreground transition-colors"
           >
              Ignorer pour l'instant
           </button>
        </div>
      </div>

      <footer className="absolute bottom-10 flex flex-col items-center gap-2">
         <p className="text-[10px] text-gray-700 font-bold uppercase tracking-[0.4em]">JE DÉPANNE • ONBOARDING PREMIUM</p>
      </footer>
    </div>
  );
}
