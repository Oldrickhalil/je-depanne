"use client";

import { useSession, signOut } from "next-auth/react";
import { User, ShieldAlert, ArrowLeft, Settings, Info, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ProfileMenuPage() {
  const { data: session } = useSession();
  
  if (!session) return null;

  const firstName = session?.user?.name?.split(" ")[0] || "Client";
  const lastName = session?.user?.name?.split(" ").slice(1).join(" ") || "";

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-700 pb-20 mt-4">
      
      {/* Header Profile Info */}
      <section className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-24 h-24 rounded-[2rem] bg-card border-2 border-primary/20 flex items-center justify-center text-primary text-4xl font-black shadow-xl shadow-primary/10">
           {firstName.charAt(0).toUpperCase()}
        </div>
        <div>
           <h1 className="text-3xl font-title font-bold tight-tracking uppercase leading-none text-foreground">
             {firstName} <span className="text-primary">{lastName}</span>
           </h1>
           <p className="text-muted-text font-bold uppercase tracking-wider text-[10px] mt-2">
             {session?.user?.email}
           </p>
        </div>
      </section>

      {/* Menu Links */}
      <section className="space-y-3">
         <Link 
            href="/dashboard/profile/details"
            className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-card border border-card-border hover:border-primary/30 transition-all shadow-sm"
         >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <User size={18} />
               </div>
               <div className="text-left">
                  <p className="text-sm font-bold text-foreground uppercase tracking-tight">Mon Profil</p>
                  <p className="text-[9px] text-muted-text uppercase tracking-wider mt-0.5">Informations personnelles & bancaires</p>
               </div>
            </div>
            <ChevronRight size={18} className="text-muted-text group-hover:text-primary transition-colors" />
         </Link>

         <Link 
            href="/dashboard/settings"
            className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-card border border-card-border hover:border-primary/30 transition-all shadow-sm"
         >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Settings size={18} />
               </div>
               <div className="text-left">
                  <p className="text-sm font-bold text-foreground uppercase tracking-tight">Paramètres</p>
                  <p className="text-[9px] text-muted-text uppercase tracking-wider mt-0.5">Sécurité, Thème, Notifications</p>
               </div>
            </div>
            <ChevronRight size={18} className="text-muted-text group-hover:text-primary transition-colors" />
         </Link>

         <Link 
            href="/dashboard/privacy"
            className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-card border border-card-border hover:border-primary/30 transition-all shadow-sm"
         >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                  <ShieldAlert size={18} />
               </div>
               <div className="text-left">
                  <p className="text-sm font-bold text-foreground uppercase tracking-tight">Confidentialité</p>
                  <p className="text-[9px] text-muted-text uppercase tracking-wider mt-0.5">Gestion de vos données</p>
               </div>
            </div>
            <ChevronRight size={18} className="text-muted-text group-hover:text-foreground transition-colors" />
         </Link>

         <Link 
            href="/dashboard/about"
            className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-card border border-card-border hover:border-primary/30 transition-all shadow-sm"
         >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                  <Info size={18} />
               </div>
               <div className="text-left">
                  <p className="text-sm font-bold text-foreground uppercase tracking-tight">À Propos</p>
                  <p className="text-[9px] text-muted-text uppercase tracking-wider mt-0.5">Mentions légales & CGU</p>
               </div>
            </div>
            <ChevronRight size={18} className="text-muted-text group-hover:text-foreground transition-colors" />
         </Link>
      </section>

      {/* Logout Action */}
      <section className="pt-4">
         <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full group flex items-center justify-center gap-3 p-5 rounded-[1.5rem] bg-red-500/5 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all shadow-sm text-red-500"
         >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-wider">Se Déconnecter</span>
         </button>
      </section>
      
      <p className="text-center text-[9px] text-muted-text uppercase tracking-[0.15em] pt-8">
        Je Dépanne • Version 1.0.0
      </p>
    </div>
  );
}
