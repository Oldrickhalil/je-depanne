"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, PieChart, User, Settings, Plus, LayoutGrid, LogOut, ArrowRightLeft } from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import NotificationsMenu from "@/components/dashboard/NotificationsMenu";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutGrid, label: "Vue d'ensemble", href: "/dashboard" },
    { icon: ArrowRightLeft, label: "Transactions", href: "/dashboard/transactions" },
    { icon: CreditCard, label: "Mes Prêts", href: "/dashboard/loans" },
    { icon: PieChart, label: "Analyses", href: "/dashboard/stats" },
    { icon: User, label: "Mon Compte", href: "/dashboard/profile" },
  ];

  return (
    <div className="flex h-screen bg-[#070707] text-white overflow-hidden font-sans selection:bg-primary/30">
      {/* Desktop Sidebar - More minimalist, like 'Fundraising Fintech' */}
      <aside className="hidden md:flex flex-col w-24 lg:w-64 bg-[#0a0a0a] border-r border-white/5 p-6 transition-all duration-300">
        <div className="mb-12 flex justify-center lg:justify-start">
          <Link href="/dashboard" className="relative group">
            <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Image src="/images/logo-jd-color.svg" alt="Je Dépanne" width={80} height={40} className="relative z-10" />
          </Link>
        </div>

        <nav className="flex-1 space-y-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center lg:justify-start gap-4 px-4 py-4 rounded-[1.25rem] transition-all duration-300 group ${
                  isActive 
                    ? "bg-primary text-white glow-primary shadow-lg shadow-primary/20" 
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={20} className={`${isActive ? "scale-110" : "group-hover:scale-110"} transition-transform`} />
                <span className={`hidden lg:block font-bold tracking-tight uppercase text-[10px] ${isActive ? "opacity-100" : "opacity-70"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center justify-center lg:justify-start gap-4 px-4 py-4 rounded-[1.25rem] text-gray-500 hover:text-white hover:bg-white/5 transition-all font-bold tracking-tight uppercase text-[10px]"
          >
            <Settings size={20} />
            <span className="hidden lg:block">Paramètres</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center justify-center lg:justify-start gap-4 px-4 py-4 w-full rounded-[1.25rem] text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all font-bold tracking-tight uppercase text-[10px]"
          >
            <LogOut size={20} />
            <span className="hidden lg:block">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {/* Top Header - Like 'Application Layout Banking' */}
        <header className="flex items-center justify-between p-6 md:px-10 border-b border-white/5 bg-[#070707]/80 backdrop-blur-md z-20">
           <h2 className="font-title text-sm font-bold uppercase tracking-[0.2em] text-gray-400 hidden md:block">
              Expérience <span className="text-white">Premium</span>
           </h2>
           <div className="flex items-center gap-4 ml-auto">
              <button 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="md:hidden w-10 h-10 rounded-full glass flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors"
              >
                 <LogOut size={18} />
              </button>
              <NotificationsMenu />
              <Link 
                href="/dashboard/deposit"
                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors relative"
              >
                 <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-[#070707]"></div>
                 <Plus size={18} />
              </Link>
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                 <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-bold tracking-tight">Plan Actif</p>
                    <p className="text-[9px] text-primary font-black uppercase tracking-widest">Membre Élite</p>
                 </div>
                 <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden">
                    <User size={20} className="text-gray-400" />
                 </div>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* ULTRA PREMIUM Glass Bottom Nav - Mobile ONLY */}
      <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-50">
        <nav className="relative glass rounded-[2.5rem] p-2 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden">
          {/* Active indicator background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative p-4 rounded-3xl transition-all duration-500 group ${
                  isActive ? "text-primary bg-white/5" : "text-gray-500 hover:text-white"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-primary/10 blur-lg rounded-full animate-pulse"></span>
                )}
                <Icon size={22} className={`relative z-10 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
              </Link>
            );
          })}
          
          <Link 
            href="/dashboard/deposit"
            className="relative ml-1 p-4 bg-primary text-white rounded-[1.8rem] shadow-[0_10px_20px_rgba(225,29,72,0.3)] active:scale-90 transition-all duration-300"
          >
            <Plus size={22} strokeWidth={3} />
          </Link>
        </nav>
      </div>
    </div>
  );
}
