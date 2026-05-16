"use client";

import { Smartphone, ShieldCheck, Wallet, ArrowRight, KeyRound } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function OnboardingChecklist({ freshStatus }: { freshStatus?: any }) {
  const { data: session } = useSession();
  const user = session?.user as any;

  if (!user) return null;

  // Use freshStatus if available to prevent stale session UI bugs
  const kycVerified = freshStatus ? freshStatus.kycVerified : user.kycVerified;
  const hasDeposited = freshStatus ? freshStatus.hasDeposited : user.hasDeposited;
  const isInstalled = freshStatus ? freshStatus.isInstalled : user.isInstalled;
  const hasPin = freshStatus ? freshStatus.hasPin : user.hasPin;

  const steps = [
    {
      id: "pin",
      completed: hasPin,
      href: "/dashboard/onboarding/pin",
      label: "Code PIN",
      desc: "Verrouillez l'accès",
      icon: KeyRound,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    },
    {
      id: "kyc",
      completed: kycVerified,
      href: "/dashboard/onboarding/kyc",
      label: "Identité",
      desc: "Sécurisez votre compte",
      icon: ShieldCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      id: "deposit",
      completed: hasDeposited,
      href: "/dashboard/onboarding/deposit",
      label: "Premier Dépôt",
      desc: "Débloquez le bonus 80€",
      icon: Wallet,
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20"
    },
    {
      id: "pwa",
      completed: isInstalled,
      href: "/dashboard/onboarding/pwa",
      label: "Installer l'App",
      desc: "Accès rapide",
      icon: Smartphone,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20"
    }
  ];

  const pendingSteps = steps.filter(s => !s.completed);

  if (pendingSteps.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      {pendingSteps.map((step) => {
        const Icon = step.icon;
        return (
          <Link
            key={step.id}
            href={step.href}
            className={`group relative overflow-hidden rounded-[1.5rem] p-5 border ${step.border} ${step.bg} hover:brightness-125 transition-all duration-300 flex items-center justify-between gap-4 shadow-lg`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.color} bg-background shadow-inner shrink-0`}>
                <Icon size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-tight">{step.label}</h3>
                <p className={`text-[9px] font-black uppercase tracking-widest ${step.color} opacity-80 mt-0.5`}>{step.desc}</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full bg-background flex items-center justify-center ${step.color} group-hover:translate-x-1 transition-transform shrink-0`}>
              <ArrowRight size={14} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
