"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NotificationsMenu() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/activity/notifications/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.filter((n: any) => !n.read).length);
        }
      } catch (err) {
        console.error("Erreur récupération notifications:", err);
      }
    };
    
    if (userId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  return (
    <Link 
      href="/dashboard/notifications"
      className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors relative"
    >
       {unreadCount > 0 && (
         <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-[#070707] animate-pulse"></div>
       )}
       <Bell size={18} className={unreadCount > 0 ? "text-primary" : "text-white"} />
    </Link>
  );
}
