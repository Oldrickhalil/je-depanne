"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, PieChart, User, Settings, Plus, LayoutGrid, LogOut, ArrowRightLeft, Search } from "lucide-react";
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
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">
      {/* Desktop Sidebar - Hidden on pure mobile apps, but kept for responsive */}
      <aside className="hidden md:flex flex-col w-24 lg:w-64 bg-card border-r border-card-border p-6 transition-all duration-300">
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
                    : "text-muted-text hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden bg-background">
        {/* Revolut Style Header */}
        <header className="flex items-center justify-between p-4 md:p-6 md:px-10 border-b border-card-border bg-background/90 backdrop-blur-xl z-20 gap-3">
           {/* Profile (Left) */}
           <Link href="/dashboard/profile" className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 hover:bg-primary/20 transition-colors">
              <User size={20} className="text-primary" />
           </Link>

           {/* Search Bar (Center) */}
           <div className="flex-1 relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search size={16} className="text-muted-text" />
              </div>
              <input 
                 type="text" 
                 placeholder="Rechercher..." 
                 className="w-full pl-10 pr-4 py-2.5 bg-card border border-card-border rounded-[1rem] text-[11px] font-bold uppercase tracking-widest text-foreground placeholder-muted-text focus:outline-none focus:border-primary/50 transition-colors shadow-sm"
              />
           </div>

           {/* Actions (Right) */}
           <div className="flex items-center gap-2 shrink-0">
              <NotificationsMenu />
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* ULTRA PREMIUM Glass Bottom Nav - Mobile ONLY */}
      <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-50">
        <nav className="relative glass rounded-[2.5rem] p-2 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-card-border overflow-hidden">
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
                  isActive ? "text-primary bg-white/5" : "text-muted-text hover:text-white"
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
            className="relative ml-1 p-4 bg-primary text-foreground rounded-[1.8rem] shadow-[0_10px_20px_rgba(225,29,72,0.3)] active:scale-90 transition-all duration-300"
          >
            <Plus size={22} strokeWidth={3} />
          </Link>
        </nav>
      </div>
    </div>
  );
}
