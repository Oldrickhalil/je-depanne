"use client";

import Link from "next/link";
import { ArrowLeft, Info, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard/profile" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-muted-text hover:text-foreground transition-colors mb-4">
             <ArrowLeft size={12} /> Retour au Menu
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none">
            À Propos
          </h1>
          <p className="text-muted-text font-bold uppercase tracking-wider text-[9px] flex items-center gap-2">
            L'histoire de Je Dépanne
          </p>
        </div>
      </section>

      <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8">
         <div className="flex items-center gap-3 border-b border-card-border pb-4">
            <Info size={18} className="text-primary" />
            <h3 className="font-title font-bold text-lg tracking-wider uppercase text-foreground">Notre Mission</h3>
         </div>
         
         <div className="space-y-6 text-sm text-muted-text leading-relaxed">
            <p>
              Je Dépanne a été fondé en 2026 avec une mission simple : rendre le micro-crédit instantané, transparent, et accessible à tous. Nous croyons que la technologie peut éliminer les barrières bancaires traditionnelles.
            </p>
            <p>
              Grâce à notre moteur d'analyse, nous proposons des taux fixes à 3% et des décisions immédiates, loin de la complexité des établissements classiques.
            </p>
            
            <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col items-center text-center space-y-3 mt-8">
               <Heart size={24} className="text-primary" />
               <p className="text-foreground font-bold uppercase tracking-wider text-[10px]">Fait avec passion par l'équipe Je Dépanne</p>
               <p className="text-[9px] uppercase tracking-wider text-muted-text">Version 1.0.0 (Build 2026.05)</p>
            </div>
         </div>
      </div>
    </div>
  );
}
