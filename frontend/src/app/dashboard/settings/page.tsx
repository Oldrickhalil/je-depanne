"use client";

import { ArrowLeft, Bell, CreditCard, Globe, Lock, Moon, ShieldAlert, Smartphone, Fingerprint, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import PinVerificationModal from "@/components/dashboard/PinVerificationModal";
import { useToast } from "@/components/ui/ToastProvider";

type PaymentMethod = {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const userId = (session?.user as any)?.id;
  const [loading, setLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'payments' | 'security'>('notifications');
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);

  // Mock states for toggles, will be updated by fetch
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false
  });

  const fetchSavedCards = async () => {
    if (!userId) return;
    setLoadingCards(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/stripe/payment-methods/${userId}`);
      const data = await res.json();
      setSavedCards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCards(false);
    }
  };

  const deleteCard = async (pmId: string) => {
    setDeletingCard(pmId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/stripe/payment-methods/${pmId}`, { method: "DELETE" });
      if (res.ok) {
        setSavedCards(savedCards.filter(c => c.id !== pmId));
        addToast("Carte supprimée avec succès.", "SUCCESS");
      }
    } catch (err) {
      addToast("Erreur lors de la suppression.", "ERROR");
    } finally {
      setDeletingCard(null);
    }
  };

  const openStripePortal = async () => {
    setIsOpeningPortal(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/stripe/create-portal-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        addToast(data.error || "Impossible d'ouvrir le portail.", "ERROR");
      }
    } catch (err) {
      addToast("Erreur serveur.", "ERROR");
    } finally {
      setIsOpeningPortal(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments') fetchSavedCards();
  }, [activeTab]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/auth/status/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setNotifications({
            email: data.notifEmail ?? true,
            push: data.notifPush ?? true,
            sms: data.notifSms ?? false,
            marketing: data.notifMarketing ?? false
          });
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchSettings();
  }, [session, userId]);

  const toggleNotification = async (key: 'email' | 'push' | 'sms' | 'marketing') => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await fetch(`${apiUrl}/api/auth/settings/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifEmail: newNotifications.email,
          notifPush: newNotifications.push,
          notifSms: newNotifications.sms,
          notifMarketing: newNotifications.marketing
        })
      });
    } catch (err) {
      setNotifications(notifications);
    }
  };

  if (!session) return null;
  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard/profile" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-text hover:text-foreground transition-colors mb-4">
             <ArrowLeft size={12} /> Retour
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none">
            Paramètres
          </h1>
          <p className="text-muted-text font-bold uppercase tracking-[0.2em] text-[9px]">Gérez vos préférences et votre sécurité</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
         <div className="md:col-span-4 space-y-2">
            <button 
               onClick={() => setActiveTab('notifications')}
               className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === 'notifications' ? 'bg-white/10 text-white' : 'text-muted-text hover:bg-white/5'}`}
            >
               <Bell size={16} className={activeTab === 'notifications' ? "text-primary" : ""} />
               Notifications
            </button>
            <button 
               onClick={() => setActiveTab('payments')}
               className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === 'payments' ? 'bg-white/10 text-white' : 'text-muted-text hover:bg-white/5'}`}
            >
               <CreditCard size={16} className={activeTab === 'payments' ? "text-primary" : ""} />
               Moyens de paiement
            </button>
            <button 
               className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all text-muted-text hover:bg-white/5"
            >
               <ShieldAlert size={16} />
               Confidentialité
            </button>
         </div>

         <div className="md:col-span-8 space-y-6">
            
            {activeTab === 'notifications' && (
              <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 shadow-sm">
                 <div className="space-y-1 border-b border-card-border pb-6">
                    <h3 className="font-title font-bold text-lg tracking-widest uppercase text-foreground">Alertes</h3>
                    <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest">Gérez vos canaux de communication</p>
                 </div>
                 
                 <div className="space-y-6">
                    {/* (Toggles logic unchanged) */}
                    <div className="flex items-center justify-between">
                       <p className="text-sm font-bold text-foreground uppercase">Notifications Push</p>
                       <button onClick={() => toggleNotification('push')} className={`w-12 h-6 rounded-full relative transition-colors ${notifications.push ? 'bg-primary' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.push ? 'left-7' : 'left-1'}`}></div>
                       </button>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-sm font-bold text-foreground uppercase">Emails Transactionnels</p>
                       <button onClick={() => toggleNotification('email')} className={`w-12 h-6 rounded-full relative transition-colors ${notifications.email ? 'bg-primary' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.email ? 'left-7' : 'left-1'}`}></div>
                       </button>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'payments' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                     <div className="flex items-center justify-between border-b border-card-border pb-6">
                        <div className="space-y-1">
                           <h3 className="font-title font-bold text-lg tracking-widest uppercase text-foreground">Mes Cartes</h3>
                           <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest">Cartes sauvegardées via Stripe</p>
                        </div>
                        <button 
                           onClick={openStripePortal}
                           disabled={isOpeningPortal}
                           className="px-4 py-2 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                        >
                           {isOpeningPortal ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Gestion Avancée
                        </button>
                     </div>

                     <div className="space-y-4">
                        {loadingCards ? (
                           <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                        ) : savedCards.length > 0 ? (
                           savedCards.map(card => (
                              <div key={card.id} className="flex items-center justify-between p-5 bg-background border border-card-border rounded-2xl group hover:border-primary/30 transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                       {card.card.brand === 'visa' ? <img src="/images/visa.svg" className="h-3" alt="Visa" /> : <img src="/images/mastercard.svg" className="h-5" alt="Mastercard" />}
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-white">•••• {card.card.last4}</p>
                                       <p className="text-[9px] text-muted-text uppercase font-bold">Expire {card.card.exp_month}/{card.card.exp_year}</p>
                                    </div>
                                 </div>
                                 <button 
                                    onClick={() => deleteCard(card.id)}
                                    disabled={deletingCard === card.id}
                                    className="p-3 text-muted-text hover:text-red-500 transition-colors"
                                 >
                                    {deletingCard === card.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                 </button>
                              </div>
                           ))
                        ) : (
                           <div className="py-10 text-center text-muted-text uppercase text-[10px] font-black tracking-widest">Aucune carte enregistrée</div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {/* Always show Security and Danger zone below active tab or just for main settings */}
            <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8 shadow-sm">
               <div className="space-y-1 border-b border-card-border pb-6">
                  <h3 className="font-title font-bold text-lg tracking-widest uppercase text-foreground">Sécurité</h3>
                  <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest">Accès et authentification</p>
               </div>
               {/* (Security buttons unchanged) */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <p className="text-sm font-bold text-foreground uppercase">Mot de passe</p>
                     <button onClick={() => { setPendingAction("password"); setShowPinModal(true); }} className="px-4 py-2 bg-white/5 text-foreground text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors">Modifier</button>
                  </div>
               </div>
            </div>

            <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8">
               <div className="space-y-1 border-b border-card-border pb-6">
                  <h3 className="font-title font-bold text-lg tracking-widest uppercase text-foreground">Préférences</h3>
               </div>
               {/* (Theme selector logic) */}
               <div className="flex items-center justify-between p-4 bg-background border border-card-border rounded-2xl">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-foreground"><Moon size={18} /></div>
                     <div><p className="text-sm font-bold text-foreground uppercase">Thème Sombre</p></div>
                  </div>
                  <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-full">Activé par défaut</span>
               </div>
            </div>

            <div className="border border-red-500/20 rounded-[2.5rem] p-8 space-y-4">
               <h3 className="text-red-500 font-black uppercase text-xs">Zone de Danger</h3>
               <button className="px-6 py-3 bg-red-500/10 text-red-500 text-[9px] font-black uppercase rounded-xl hover:bg-red-500 hover:text-white transition-all">Supprimer mon compte</button>
            </div>
         </div>
      </div>
      
      <PinVerificationModal 
         isOpen={showPinModal} 
         onClose={() => setShowPinModal(false)} 
         onSuccess={() => {
           setShowPinModal(false);
           if (pendingAction === 'password') addToast("Redirection vers la modification.", "SUCCESS");
         }} 
         title="Vérification"
         description="Saisissez votre code PIN"
      />
    </div>
  );
}
