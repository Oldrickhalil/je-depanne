"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard/profile" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-muted-text hover:text-foreground transition-colors mb-4">
             <ArrowLeft size={12} /> Retour au Menu
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none">
            Confidentialité
          </h1>
          <p className="text-muted-text font-bold uppercase tracking-wider text-[9px] flex items-center gap-2">
            Vos données sont protégées
          </p>
        </div>
      </section>

      <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8">
         <div className="flex items-center gap-3 border-b border-card-border pb-4">
            <ShieldAlert size={18} className="text-primary" />
            <h3 className="font-title font-bold text-lg tracking-wider uppercase text-foreground">Gestion des Données</h3>
         </div>
         
         <div className="space-y-6 text-sm text-muted-text leading-relaxed">
            <p>
              Chez Je Dépanne, la confidentialité de vos données bancaires et personnelles est notre priorité absolue. Conformément au RGPD, nous ne partageons aucune de vos informations avec des courtiers tiers.
            </p>
            <p>
              Les documents fournis lors de l'étape KYC (Pièces d'identité) sont chiffrés et stockés uniquement dans le but de satisfaire aux obligations légales de lutte contre le blanchiment d'argent (AML).
            </p>
            <h4 className="text-foreground font-bold uppercase tracking-wider text-[10px]">Droits d'accès</h4>
            <p>
              Vous avez le droit de demander l'effacement de vos données personnelles à tout moment, sous réserve que vous ayez soldé l'intégralité de vos micro-crédits en cours. La suppression d'un compte se fait via l'espace Paramètres.
            </p>
         </div>
      </div>
    </div>
  );
}
