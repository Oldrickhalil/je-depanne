"use client";

import { useState, useEffect, useRef } from "react";
import { useSearch } from "@/context/SearchContext";
import { useSession } from "next-auth/react";
import { 
  Search, 
  ArrowRight, 
  Clock, 
  Zap, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard,
  User,
  X,
  Loader2
} from "lucide-react";
import Link from "next/link";

type SearchResult = {
  id: string;
  type: 'TRANSACTION' | 'LOAN' | 'PAGE';
  title: string;
  subtitle: string;
  amount?: number;
  href: string;
  icon: any;
  color: string;
};

export default function GlobalSearch() {
  const { searchQuery, setSearchQuery } = useSearch();
  const { data: session } = useSession();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setIsVisible(true);
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // Fetch loans and transactions to search through
        const [loansRes, transRes] = await Promise.all([
           fetch(`${apiUrl}/api/loans/user/${userId}`),
           fetch(`${apiUrl}/api/activity/transactions/${userId}`)
        ]);

        const loans = await loansRes.json();
        const transactions = await transRes.json();

        const searchLower = searchQuery.toLowerCase();
        const found: SearchResult[] = [];

        // 1. Search Pages
        const pages = [
           { title: 'Déposer de l\'argent', subtitle: 'Alimenter mon compte', href: '/dashboard/deposit', icon: Plus, color: 'text-green-500' },
           { title: 'Demander un prêt', subtitle: 'Financement instantané', href: '/dashboard/loans/request', icon: Zap, color: 'text-primary' },
           { title: 'Mon Profil', subtitle: 'Informations personnelles', href: '/dashboard/profile', icon: User, color: 'text-blue-500' },
           { title: 'Mes Paramètres', subtitle: 'Sécurité et notifications', href: '/dashboard/settings', icon: Settings, color: 'text-gray-500' },
        ];

        pages.forEach(p => {
           if (p.title.toLowerCase().includes(searchLower)) {
              found.push({ id: p.href, type: 'PAGE', ...p });
           }
        });

        // 2. Search Loans
        loans.forEach((l: any) => {
           if (l.amount.toString().includes(searchLower) || l.id.toLowerCase().includes(searchLower)) {
              found.push({
                 id: l.id,
                 type: 'LOAN',
                 title: `Prêt de ${l.amount}€`,
                 subtitle: `Statut: ${l.status} • ${new Date(l.createdAt).toLocaleDateString()}`,
                 href: '/dashboard/loans',
                 icon: CreditCard,
                 color: 'text-primary'
              });
           }
        });

        // 3. Search Transactions
        transactions.forEach((t: any) => {
            if (t.amount.toString().includes(searchLower) || t.type.toLowerCase().includes(searchLower)) {
                found.push({
                    id: t.id,
                    type: 'TRANSACTION',
                    title: t.type === 'DEPOSIT' ? 'Dépôt' : t.type === 'WITHDRAWAL' ? 'Retrait' : 'Transaction',
                    subtitle: `${new Date(t.createdAt).toLocaleDateString()} • ${t.status}`,
                    amount: t.amount,
                    href: '/dashboard/transactions',
                    icon: t.type === 'DEPOSIT' ? ArrowDownLeft : ArrowUpRight,
                    color: t.type === 'DEPOSIT' ? 'text-green-500' : 'text-red-500'
                });
            }
        });

        setResults(found.slice(0, 8)); // Limit to 8 results
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, userId]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isVisible || searchQuery.length < 2) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-3 bg-card border border-card-border rounded-[1.5rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 max-h-[70vh] flex flex-col"
    >
      <div className="p-4 border-b border-card-border flex items-center justify-between bg-white/[0.02]">
         <p className="text-[10px] font-black uppercase tracking-widest text-muted-text">Résultats pour "{searchQuery}"</p>
         <button onClick={() => setSearchQuery("")} className="text-muted-text hover:text-white">
            <X size={14} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
         {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
               <Loader2 size={24} className="animate-spin text-primary" />
               <p className="text-[9px] font-bold uppercase tracking-widest text-muted-text">Recherche en cours...</p>
            </div>
         ) : results.length > 0 ? (
            <div className="p-2 space-y-1">
               {results.map((res) => (
                  <Link 
                    key={res.id + res.type}
                    href={res.href}
                    onClick={() => {
                       setSearchQuery("");
                       setIsVisible(false);
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-background border border-card-border flex items-center justify-center ${res.color} group-hover:scale-110 transition-transform`}>
                           <res.icon size={18} />
                        </div>
                        <div>
                           <p className="text-xs font-black uppercase tracking-tight text-foreground">{res.title}</p>
                           <p className="text-[9px] text-muted-text font-bold uppercase tracking-wider">{res.subtitle}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        {res.amount && (
                           <p className={`text-sm font-black tracking-tighter ${res.color}`}>
                              {res.amount.toFixed(2)} €
                           </p>
                        )}
                        <ArrowRight size={14} className="text-gray-700 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                     </div>
                  </Link>
               ))}
            </div>
         ) : (
            <div className="py-12 text-center space-y-3">
               <Search size={32} className="mx-auto text-gray-800" />
               <p className="text-[10px] font-bold uppercase tracking-widest text-muted-text">Aucun résultat trouvé</p>
            </div>
         )}
      </div>

      <div className="p-4 bg-background/50 border-t border-card-border">
         <p className="text-[8px] text-center text-muted-text uppercase font-bold tracking-widest">
            Je Dépanne Intelligence Search
         </p>
      </div>
    </div>
  );
}

// Helper icons for the page search
function Plus(props: any) { return <CreditCard {...props} /> }
function Settings(props: any) { return <CreditCard {...props} /> }
