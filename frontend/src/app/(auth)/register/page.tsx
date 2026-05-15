"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, User, Loader2, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Une erreur est survenue lors de l'inscription.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
           <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Compte Créé !</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Redirection vers la page de connexion...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 selection:bg-primary/30">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <Link href="/">
             <Image src="/images/logo-jd-color.svg" alt="JD" width={80} height={50} className="mb-2" />
          </Link>
          <h1 className="text-4xl font-title font-black tight-tracking uppercase text-white leading-none">
            Créer un <span className="text-primary">compte</span>
          </h1>
          <p className="text-gray-500 text-[14px] font-medium tracking-[0.0em]">Obtenez votre micro crédit en moins de 24h</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest">Erreur Inscription</p>
              <p className="text-[10px] font-medium opacity-80 uppercase tracking-tight">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={16} />
               <input
                type="text"
                required
                placeholder="Prénom"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-11 pr-4 text-[12px] font-medium tracking-wider text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
              />
            </div>
            <div className="relative group">
               <input
                type="text"
                required
                placeholder="Nom"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 px-6 text-[12px] font-medium tracking-wider text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
              />
            </div>
          </div>

          <div className="relative group">
             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={16} />
             <input
              type="email"
              required
              placeholder="Adresse e-mail"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-11 pr-6 text-[12px] font-medium tracking-wider text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
            />
          </div>
          
          <div className="relative group">
             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={16} />
             <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Votre mot de passe"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-11 pr-12 text-[12px] font-medium tracking-wider text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-5 bg-primary text-white font-black text-xm uppercase tracking-[0.0em] rounded-2xl hover:bg-primary/80 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                S'inscrire <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-gray-600 text-[9px] font-black uppercase tracking-widest">OU</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full py-4 bg-[#111] border border-white/5 text-white font-black text-xs uppercase tracking-[0.1em] rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-3"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264,51.509 C -3.264,50.719 -3.334,49.969 -3.454,49.239 L -14.754,49.239 L -14.754,53.749 L -8.284,53.749 C -8.574,55.229 -9.424,56.479 -10.684,57.329 L -10.684,60.329 L -6.824,60.329 C -4.564,58.239 -3.264,55.159 -3.264,51.509 z"/>
              <path fill="#34A853" d="M -14.754,63.239 C -11.514,63.239 -8.804,62.159 -6.824,60.329 L -10.684,57.329 C -11.764,58.049 -13.134,58.489 -14.754,58.489 C -17.884,58.489 -20.534,56.379 -21.484,53.529 L -25.464,53.529 L -25.464,56.619 C -23.494,60.539 -19.444,63.239 -14.754,63.239 z"/>
              <path fill="#FBBC05" d="M -21.484,53.529 C -21.734,52.809 -21.864,52.039 -21.864,51.239 C -21.864,50.439 -21.724,49.669 -21.484,48.949 L -21.484,45.859 L -25.464,45.859 C -26.284,47.479 -26.754,49.299 -26.754,51.239 C -26.754,53.179 -26.284,54.999 -25.464,56.619 L -21.484,53.529 z"/>
              <path fill="#EA4335" d="M -14.754,43.989 C -12.984,43.989 -11.404,44.599 -10.154,45.789 L -6.734,41.939 C -8.804,40.009 -11.514,39.239 -14.754,39.239 C -19.444,39.239 -23.494,41.939 -25.464,45.859 L -21.484,48.949 C -20.534,46.099 -17.884,43.989 -14.754,43.989 z"/>
            </g>
          </svg>
          S'inscrire avec Google
        </button>

        <div className="flex flex-col items-center gap-4 text-xs font-black uppercase tracking-widest">
           <p className="text-gray-600">Déjà membre ?</p>
           <Link href="/login" className="text-primary hover:underline underline-offset-4">
              Connectez-vous ici
           </Link>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-3 text-gray-700">
         <ShieldCheck size={16} />
         <p className="text-[9px] font-black uppercase tracking-[0.0em]">Propulsé par la FINTECH</p>
      </div>
    </div>
  );
}
