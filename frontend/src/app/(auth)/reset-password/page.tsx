"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      alert("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/password-reset-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(data.message || "Le lien est invalide ou a expiré.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="w-full max-w-md bg-card border border-card-border rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl">
      <XCircle size={48} className="mx-auto text-red-500" />
      <h1 className="text-2xl font-black uppercase">Lien Invalide</h1>
      <p className="text-sm text-muted-text uppercase font-bold">Le jeton de réinitialisation est manquant.</p>
      <Link href="/login" className="block py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Retour au Login</Link>
    </div>
  );

  return (
    <div className="w-full max-w-md bg-card border border-card-border rounded-[2.5rem] p-10 space-y-8 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
      
      {status === "form" && (
        <>
          <div className="space-y-2">
             <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary mb-4">
                <Lock size={32} />
             </div>
             <h1 className="text-3xl font-black uppercase tracking-tighter">Nouveau Mot de Passe</h1>
             <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest leading-relaxed">
               Définissez votre nouvelle clé d'accès sécurisée.
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
               <label className="text-[9px] font-black text-muted-text uppercase tracking-widest ml-1">Nouveau mot de passe</label>
               <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl py-4 px-5 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
               </div>
            </div>
            
            <div className="space-y-1.5">
               <label className="text-[9px] font-black text-muted-text uppercase tracking-widest ml-1">Confirmer le mot de passe</label>
               <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-background border border-card-border rounded-xl py-4 px-5 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-6"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Mettre à jour <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </>
      )}

      {status === "success" && (
        <div className="space-y-8 py-4">
           <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-lg">
              <CheckCircle2 size={48} />
           </div>
           <div className="space-y-3">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Succès !</h1>
              <p className="text-xs text-muted-text font-bold uppercase tracking-widest leading-relaxed px-4">
                Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.
              </p>
           </div>
           <Link 
             href="/login"
             className="flex items-center justify-center gap-3 w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-primary/90 transition-all"
           >
             Se connecter <ArrowRight size={18} />
           </Link>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-8 py-4">
           <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <XCircle size={48} />
           </div>
           <div className="space-y-3">
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Erreur</h1>
              <p className="text-xs text-red-500 font-bold uppercase tracking-widest leading-relaxed px-4">
                {message}
              </p>
           </div>
           <Link 
             href="/login"
             className="block w-full py-5 bg-background border border-card-border text-foreground font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-white/5 transition-all"
           >
             Retour au login
           </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Suspense fallback={<Loader2 className="animate-spin text-primary" size={40} />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
