"use client";

import { useState, useEffect } from "react";
import { BellRing, Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/ToastProvider";

const publicVapidKey = "BPghLxKuTeNUFLLSNLBDWZ4WMwTQSSKGwyJcfFE_mcVM2UDAAV8nE001w-5Jag0N4kI044jSZAeZgnaQ7mexZH0";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationPrompt() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      
      // Check if already subscribed or denied
      if (Notification.permission === "default") {
         const dismissed = localStorage.getItem("jd_push_dismissed");
         if (!dismissed) {
            setShowPrompt(true);
         }
      }
    }
  }, []);

  const subscribeUser = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const userId = (session?.user as any)?.id;

        const res = await fetch(`${apiUrl}/api/auth/push-subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, subscription }),
        });

        if (res.ok) {
          addToast("Notifications activées avec succès !", "SUCCESS");
          setShowPrompt(false);
        } else {
          throw new Error("Erreur serveur");
        }
      } else {
        addToast("Permission refusée par le navigateur.", "WARNING");
        setShowPrompt(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'abonnement push:", error);
      addToast("Impossible d'activer les notifications.", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem("jd_push_dismissed", "true");
    setShowPrompt(false);
  };

  if (!isSupported || !showPrompt || !session) return null;

  return (
    <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 p-5 rounded-3xl mb-8 flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 shadow-xl shadow-primary/5">
       <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 animate-bounce-slow">
             <BellRing size={20} />
          </div>
          <div className="space-y-1">
             <h3 className="text-sm font-black text-white uppercase tracking-tight">Activer les alertes</h3>
             <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-sm">
                Soyez alerté instantanément quand vos prêts sont approuvés ou remboursés, même si l'application est fermée.
             </p>
          </div>
       </div>
       <div className="flex flex-col md:flex-row gap-2 shrink-0">
          <button 
             onClick={subscribeUser}
             disabled={loading}
             className="px-6 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
             {loading ? <Loader2 size={14} className="animate-spin" /> : "Activer"}
          </button>
          <button 
             onClick={dismiss}
             className="px-3 py-3 text-gray-500 hover:text-white transition-colors flex items-center justify-center rounded-2xl bg-white/5 md:bg-transparent"
          >
             <X size={16} />
          </button>
       </div>
    </div>
  );
}
