"use client";

import { ArrowLeft, Bell, CreditCard, Globe, Lock, Moon, ShieldAlert, Smartphone, Fingerprint } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [loading, setLoading] = useState(true);

  // Mock states for toggles, will be updated by fetch
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false
  });

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
    setNotifications(newNotifications); // Optimistic UI update

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
      console.error("Error saving setting:", err);
      // Revert on failure
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
          <Link href="/dashboard" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors mb-4">
             <ArrowLeft size={12} /> Tableau de Bord
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none">
            Paramètres
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[9px] flex items-center gap-2">
            Préférences de l'application et notifications
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
         {/* Navigation Menu (Left) */}
         <div className="md:col-span-4 space-y-2">
            {[
               { icon: Bell, label: "Notifications", active: true },
               { icon: ShieldAlert, label: "Confidentialité", active: false },
               { icon: CreditCard, label: "Moyens de paiement", active: false },
               { icon: Globe, label: "Langue & Région", active: false },
               { icon: Smartphone, label: "Appareils connectés", active: false },
            ].map((item, idx) => (
               <button 
                  key={idx}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all ${
                     item.active ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                  }`}
               >
                  <item.icon size={16} className={item.active ? "text-primary" : ""} />
                  {item.label}
               </button>
            ))}
         </div>

         {/* Settings Content (Right) */}
         <div className="md:col-span-8 space-y-6">
            
            {/* Notifications Section */}
            <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 space-y-8">
               <div className="space-y-1 border-b border-white/5 pb-6">
                  <h3 className="font-title font-bold text-lg tracking-widest uppercase">Alertes & Notifications</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gérez comment nous vous contactons</p>
               </div>
               
               <div className="space-y-6">
                  {/* Toggle Item */}
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Notifications Push</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Alertes sur votre appareil (Requis pour l'app)</p>
                     </div>
                     <button 
                        onClick={() => toggleNotification('push')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${notifications.push ? 'bg-primary' : 'bg-white/10'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.push ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>

                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Emails Transactionnels</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Mises à jour de prêts et dépôts</p>
                     </div>
                     <button 
                        onClick={() => toggleNotification('email')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${notifications.email ? 'bg-primary' : 'bg-white/10'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.email ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>

                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">SMS</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Rappels de remboursement urgents</p>
                     </div>
                     <button 
                        onClick={() => toggleNotification('sms')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${notifications.sms ? 'bg-primary' : 'bg-white/10'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.sms ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>

                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Offres Promotionnelles</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Bonus et nouvelles fonctionnalités</p>
                     </div>
                     <button 
                        onClick={() => toggleNotification('marketing')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${notifications.marketing ? 'bg-primary' : 'bg-white/10'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.marketing ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>
               </div>
            </div>

            {/* App Preferences */}
            <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 space-y-8">
               <div className="space-y-1 border-b border-white/5 pb-6">
                  <h3 className="font-title font-bold text-lg tracking-widest uppercase">Préférences de l'App</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Personnalisez votre expérience</p>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#161616] border border-white/5 rounded-2xl">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                           <Moon size={18} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white uppercase tracking-tight">Thème Sombre</p>
                           <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Je Dépanne est optimisé pour le mode sombre</p>
                        </div>
                     </div>
                     <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">
                        Activé par défaut
                     </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#161616] border border-white/5 rounded-2xl">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                           <Fingerprint size={18} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white uppercase tracking-tight">Connexion Biométrique</p>
                           <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">FaceID ou TouchID</p>
                        </div>
                     </div>
                     <button className="px-4 py-2 bg-white/5 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors">
                        Configurer
                     </button>
                  </div>
               </div>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/20 rounded-[2.5rem] p-8 space-y-4">
               <h3 className="text-red-500 font-black uppercase tracking-widest text-xs">Zone de Danger</h3>
               <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                  La suppression de votre compte est définitive. Assurez-vous d'avoir remboursé tous vos prêts en cours avant d'initier cette procédure.
               </p>
               <button className="px-6 py-3 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                  Supprimer mon compte
               </button>
            </div>

         </div>
      </div>
    </div>
  );
}
