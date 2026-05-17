"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Lock, Loader2, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, UserCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        setError(res.error.replace("Error: ", ""));
      } else {
        // We'll verify the role in the layout/middleware, but for now redirect
        router.push("/admin/loans");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
      {/* Admin Background Decor - Gold/Black theme */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] border border-amber-500/20 flex items-center justify-center mb-4 shadow-2xl shadow-amber-500/5">
             <ShieldCheck size={40} className="text-amber-500" />
          </div>
          <h1 className="text-4xl font-title font-black tight-tracking uppercase text-white">
            Console <span className="text-amber-500">Admin</span>
          </h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.15em]">Accès Restreint • Système Sécurisé</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wider">Échec d'Authentification</p>
              <p className="text-[10px] font-medium opacity-80 uppercase tracking-tight">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="relative group">
               <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" size={18} />
               <input
                type="text"
                required
                placeholder="Identifiant Admin"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[12px] font-medium tracking-wider text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-800"
              />
            </div>
            
            <div className="relative group">
               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" size={18} />
               <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-[12px] font-medium tracking-wider text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/10 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                Déverrouiller la Console <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[9px] text-gray-700 font-bold uppercase tracking-wider pt-8">
           JE DÉPANNE v1.0 • ADMIN PORTAL
        </p>
      </div>

      <div className="absolute bottom-10 flex items-center gap-3 text-gray-800">
         <ShieldCheck size={16} />
         <p className="text-[10px] font-bold uppercase tracking-wider">Protection de Niveau Bancaire</p>
      </div>
    </div>
  );
}
