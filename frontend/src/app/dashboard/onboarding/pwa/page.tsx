"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Smartphone, Download, Share, PlusSquare, ArrowRight, CheckCircle2 } from "lucide-react";

export default function PWAPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        await markAsInstalled();
      }
      setDeferredPrompt(null);
    }
  };

  const markAsInstalled = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/update-installation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as any)?.id,
        }),
      });

      if (res.ok) {
        await update({ ...session, user: { ...session?.user, isInstalled: true } });
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Installation update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full"></div>

        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Accès Rapide</h1>
          <p className="text-gray-400">Ajoutez Je Dépanne à votre écran d'accueil pour une expérience fluide et des notifications instantanées.</p>
        </div>

        {isIOS ? (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
              <p className="text-sm font-medium text-white flex items-center gap-2">
                Instructions pour iPhone/iPad :
              </p>
              <ol className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">1</span>
                  <span>Appuyez sur le bouton <Share className="w-4 h-4 inline mx-1 text-blue-400" /> Partager en bas de l'écran.</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">2</span>
                  <span>Faites défiler et appuyez sur <PlusSquare className="w-4 h-4 inline mx-1" /> "Sur l'écran d'accueil".</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">3</span>
                  <span>Appuyez sur "Ajouter" en haut à droite.</span>
                </li>
              </ol>
            </div>
            <button
              onClick={markAsInstalled}
              className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all"
            >
              C'est fait !
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                Installer l'application <Download className="w-5 h-5" />
              </button>
            ) : (
              <div className="text-center p-6 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                 <p className="text-sm text-gray-400">L'application est déjà installée ou votre navigateur ne supporte pas l'installation automatique.</p>
                 <button
                  onClick={markAsInstalled}
                  className="text-primary font-bold text-sm hover:underline"
                >
                  Marquer comme installé
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          <CheckCircle2 className="w-3 h-3" />
          <span>Sécurisé & Optimisé</span>
        </div>
      </div>
    </div>
  );
}
