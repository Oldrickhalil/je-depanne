"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, ShieldCheck, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
};

export default function NotificationsMenu() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/activity/notifications/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Erreur récupération notifications:", err);
      }
    };
    
    if (userId) {
      fetchNotifications();
      // Poll every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = async () => {
    if (!userId) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await fetch(`${apiUrl}/api/activity/notifications/${userId}/read`, { method: "POST" });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
       markAsRead();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={handleOpen}
        className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors relative"
      >
         {unreadCount > 0 && (
           <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-[#070707] animate-pulse"></div>
         )}
         <Bell size={18} className={unreadCount > 0 ? "text-primary" : "text-white"} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 max-h-96 overflow-y-auto custom-scrollbar bg-[#111] border border-white/10 rounded-[2rem] shadow-2xl p-4 animate-in slide-in-from-top-4 duration-300 z-50">
           <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Notifications</h3>
              <span className="text-[8px] bg-white/5 text-gray-500 px-2 py-1 rounded-full uppercase tracking-widest">{notifications.length} au total</span>
           </div>

           <div className="space-y-2">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                   <div key={notif.id} className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${notif.read ? 'bg-white/5 border-transparent opacity-70' : 'bg-[#161616] border-white/10'}`}>
                      <div className={`mt-0.5 shrink-0 ${notif.type === 'SUCCESS' ? 'text-green-500' : notif.type === 'ERROR' ? 'text-red-500' : 'text-primary'}`}>
                         {notif.type === 'SUCCESS' ? <Check size={16} /> : notif.type === 'ERROR' ? <XCircle size={16} /> : <Info size={16} />}
                      </div>
                      <div className="space-y-1">
                         <p className="text-xs font-bold text-white uppercase tracking-tight">{notif.title}</p>
                         <p className="text-[9px] text-gray-400 leading-relaxed font-medium">{notif.message}</p>
                         <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest pt-1">{new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}</p>
                      </div>
                   </div>
                ))
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 text-gray-500">
                   <Bell size={24} className="opacity-20 mb-2" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Aucune alerte</p>
                   <p className="text-[8px] uppercase tracking-widest">Vous êtes à jour.</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
