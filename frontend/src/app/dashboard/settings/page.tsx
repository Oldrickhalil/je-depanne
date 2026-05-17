"use client";

import { ArrowLeft, Bell, CreditCard, Globe, Lock, Moon, ShieldAlert, Smartphone, Fingerprint, Trash2, Plus, Eye, EyeOff, ShieldCheck, X, Check } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import PinVerificationModal from "@/components/dashboard/PinVerificationModal";
import { useToast } from "@/components/ui/ToastProvider";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import AddCardForm from "../deposit/AddCardForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "pk_test_placeholder");

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
  const userEmail = session?.user?.email;
  
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'payments' | 'security'>('notifications');
  
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Security States
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [pinChangeData, setPinChangeData] = useState({ password: "", newPin: "", confirmPin: "" });
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
      setSavedCards(data || []);
    } catch (err) {
      console.error("Error fetching cards:", err);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleAddCardSuccess = () => {
    setShowAddCard(false);
    addToast("Votre carte a été enregistrée.", "SUCCESS");
    fetchSavedCards();
  };

  const deleteCard = async (pmId: string) => {
    setDeletingCard(pmId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/stripe/payment-methods/${pmId}`, { method: "DELETE" });
      if (res.ok) {
        setSavedCards(savedCards.filter(c => c.id !== pmId));
        addToast("Carte supprimée.", "SUCCESS");
      }
    } catch (err) {
      addToast("Erreur suppression.", "ERROR");
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

  const handlePasswordResetRequest = async () => {
    setIsRequestingReset(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/password-reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      if (res.ok) {
        addToast("Lien de réinitialisation envoyé par e-mail.", "SUCCESS");
      } else {
        throw new Error();
      }
    } catch (err) {
      addToast("Erreur lors de la demande.", "ERROR");
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinChangeData.newPin !== pinChangeData.confirmPin) {
      addToast("Les codes PIN ne correspondent pas.", "ERROR");
      return;
    }
    if (pinChangeData.newPin.length < 4) {
        addToast("Le code PIN doit faire 4 chiffres.", "ERROR");
        return;
    }

    setIsUpdatingPin(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/update-pin-secure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password: pinChangeData.password, newPin: pinChangeData.newPin }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast("Code PIN mis à jour !", "SUCCESS");
        setShowPinChange(false);
        setPinChangeData({ password: "", newPin: "", confirmPin: "" });
      } else {
        addToast(data.message || "Erreur lors de la mise à jour.", "ERROR");
      }
    } catch (err) {
      addToast("Erreur serveur.", "ERROR");
    } finally {
      setIsUpdatingPin(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments') fetchSavedCards();
  }, [activeTab, userId]);

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

  const pendingActionHandler = () => {
    setShowPinModal(false);
    if (pendingAction === 'password') handlePasswordResetRequest();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard/profile" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-muted-text hover:text-foreground transition-colors mb-4">
             <ArrowLeft size={12} /> Retour
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none text-foreground">
            Paramètres
          </h1>
          <p className="text-muted-text font-bold uppercase tracking-wider text-[9px]">Gérez vos préférences et votre sécurité</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
         <div className="md:col-span-4 space-y-2">
            {[
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'payments', label: 'Paiements', icon: CreditCard },
              { id: 'security', label: 'Sécurité', icon: Lock }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold uppercase tracking-wider text-[10px] transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-muted-text hover:bg-white/5'}`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? "text-primary" : ""} />
                {tab.label}
              </button>
            ))}
         </div>

         <div className="md:col-span-8 space-y-6">
            
            {activeTab === 'notifications' && (
              <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 shadow-sm">
                 <div className="space-y-1 border-b border-card-border pb-6">
                    <h3 className="font-title font-bold text-lg tracking-widest uppercase text-foreground">Alertes</h3>
                    <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest">Gérez vos canaux de communication</p>
                 </div>
                 
                 <div className="space-y-6">
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
                           onClick={() => setShowAddCard(true)}
                           className="px-4 py-2 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                           <Plus size={12} /> Ajouter une carte
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
                        
                        <button 
                           onClick={openStripePortal}
                           disabled={isOpeningPortal}
                           className="w-full py-3 text-[8px] font-black text-muted-text uppercase tracking-widest hover:text-foreground transition-colors flex items-center justify-center gap-2"
                        >
                           {isOpeningPortal && <Loader2 size={10} className="animate-spin" />} Accéder au portail de facturation Stripe
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 shadow-sm">
                 <div className="space-y-1 border-b border-card-border pb-6">
                    <h3 className="font-title font-bold text-lg tracking-widest uppercase text-foreground">Sécurité & Accès</h3>
                    <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest">Gérez vos secrets de connexion</p>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-background border border-card-border rounded-2xl">
                       <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground uppercase tracking-tight">Mot de passe</p>
                          <p className="text-[9px] text-muted-text uppercase font-bold">Un lien sera envoyé à {userEmail}</p>
                       </div>
                       <button 
                         onClick={() => { setPendingAction("password"); setShowPinModal(true); }}
                         className="px-6 py-3 bg-white/5 text-foreground text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
                       >
                          Modifier
                       </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background border border-card-border rounded-2xl">
                       <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground uppercase tracking-tight">Code PIN</p>
                          <p className="text-[9px] text-muted-text uppercase font-bold">Utilisé pour les actions sensibles</p>
                       </div>
                       <button 
                         onClick={() => setShowPinChange(true)}
                         className="px-6 py-3 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-primary hover:text-white transition-all"
                       >
                          Changer mon PIN
                       </button>
                    </div>
                 </div>
              </div>
            )}

            <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8 shadow-sm">
               <div className="space-y-1 border-b border-card-border pb-6">
                  <h3 className="font-title font-bold text-lg tracking-widest uppercase text-foreground">Préférences</h3>
               </div>
               <div className="flex items-center justify-between p-4 bg-background border border-card-border rounded-2xl">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-foreground"><Moon size={18} /></div>
                     <div><p className="text-sm font-bold text-foreground uppercase tracking-tight text-foreground">Thème Sombre</p></div>
                  </div>
                  <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-full">Activé par défaut</span>
               </div>
            </div>

            <div className="border border-red-500/20 rounded-[2.5rem] p-8 space-y-4">
               <h3 className="text-red-500 font-black uppercase text-xs tracking-wider">Zone de Danger</h3>
               <button className="px-6 py-3 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-red-500 hover:text-white transition-all">Supprimer mon compte</button>
            </div>
         </div>
      </div>

      <PinVerificationModal 
         isOpen={showPinModal} 
         onClose={() => setShowPinModal(false)} 
         onSuccess={pendingActionHandler} 
         title="Vérification"
         description="Saisissez votre code PIN"
      />

      {showPinChange && (
        <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4 h-[100dvh] w-screen animate-in fade-in duration-300">
           <div className="w-full max-w-sm bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8 relative shadow-2xl overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <button onClick={() => setShowPinChange(false)} className="absolute top-6 right-6 text-muted-text hover:text-white transition-colors"><X size={20} /></button>

              <div className="space-y-2">
                 <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Nouveau Code PIN</h2>
                 <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest px-4">Vérifiez votre identité pour continuer.</p>
              </div>

              <form onSubmit={handlePinChange} className="space-y-5">
                 <div className="space-y-4">
                    <div className="space-y-1.5 text-left">
                       <label className="text-[9px] font-black text-muted-text uppercase tracking-widest ml-1">Mot de passe du compte</label>
                       <div className="relative">
                          <input 
                            type={showPass ? "text" : "password"} required
                            value={pinChangeData.password}
                            onChange={(e) => setPinChangeData({...pinChangeData, password: e.target.value})}
                            className="w-full bg-background border border-card-border rounded-xl py-4 px-5 text-xs font-bold text-white focus:outline-none focus:border-primary/50"
                          />
                          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white">
                             {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-muted-text uppercase tracking-widest ml-1">Nouveau PIN</label>
                          <input 
                            type="password" maxLength={4} required
                            value={pinChangeData.newPin}
                            onChange={(e) => setPinChangeData({...pinChangeData, newPin: e.target.value.replace(/\D/g, '')})}
                            className="w-full bg-background border border-card-border rounded-xl py-4 px-5 text-center text-xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-primary/50"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-muted-text uppercase tracking-widest ml-1">Confirmer</label>
                          <input 
                            type="password" maxLength={4} required
                            value={pinChangeData.confirmPin}
                            onChange={(e) => setPinChangeData({...pinChangeData, confirmPin: e.target.value.replace(/\D/g, '')})}
                            className="w-full bg-background border border-card-border rounded-xl py-4 px-5 text-center text-xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-primary/50"
                          />
                       </div>
                    </div>
                 </div>

                 <button 
                   type="submit" disabled={isUpdatingPin}
                   className="w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isUpdatingPin ? <Loader2 className="animate-spin" size={18} /> : <>Valider le changement <Check size={18} /></>}
                 </button>
              </form>
           </div>
        </div>
      )}

      {showAddCard && (
        <Elements stripe={stripePromise}>
           <AddCardForm 
             userId={userId} 
             onSuccess={handleAddCardSuccess} 
             onCancel={() => setShowAddCard(false)} 
           />
        </Elements>
      )}
    </div>
  );
}
