"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle2, Info, ShieldCheck, XCircle, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/activity/notifications/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          
          // If there are unread notifications, mark them as read after a short delay
          if (data.some((n: Notification) => !n.read)) {
             setTimeout(() => markAsRead(), 2000);
          }
        }
      } catch (err) {
        console.error("Erreur récupération notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const markAsRead = async () => {
    if (!userId) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await fetch(`${apiUrl}/api/activity/notifications/${userId}/read`, { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors mb-4">
             <ArrowLeft size={12} /> Tableau de Bord
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none">
            Centre de <span className="text-primary">Notifications</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[9px] flex items-center gap-2">
            Restez informé sur vos demandes et échéances
          </p>
        </div>
      </section>

      <div className="space-y-4">
         {loading ? (
            <div className="flex justify-center py-20">
               <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            </div>
         ) : notifications.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
               {notifications.map((notif) => (
                  <div key={notif.id} className={`p-6 rounded-[2rem] border flex md:items-center items-start gap-5 transition-colors ${notif.read ? 'bg-[#0c0c0c] border-white/5 opacity-80' : 'bg-[#111111] border-primary/20 shadow-lg shadow-primary/5'}`}>
                     <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${notif.read ? 'bg-white/5 text-gray-400' : (notif.type === 'SUCCESS' ? 'bg-green-500/20 text-green-500' : notif.type === 'ERROR' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary')}`}>
                        {notif.type === 'SUCCESS' ? <CheckCircle2 size={24} /> : notif.type === 'ERROR' ? <XCircle size={24} /> : <Info size={24} />}
                     </div>
                     <div className="space-y-1.5 flex-1">
                        <div className="flex justify-between items-center">
                           <p className="text-sm font-black text-white uppercase tracking-tight">{notif.title}</p>
                           {!notif.read && <span className="w-2 h-2 bg-primary rounded-full animate-pulse shrink-0"></span>}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{notif.message}</p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest pt-1">{new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-[#0c0c0c] border border-white/5 border-dashed rounded-[3rem]">
               <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-gray-600">
                  <Bell size={32} />
               </div>
               <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-white">Aucune alerte</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Vous êtes totalement à jour.</p>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
