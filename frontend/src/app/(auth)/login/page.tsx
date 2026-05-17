"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import VerifyEmailModal from "@/components/auth/VerifyEmailModal";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
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
        const errorMessage = res.error.replace("Error: ", "");
        if (errorMessage.includes("vérifier votre adresse e-mail")) {
           setShowVerifyModal(true);
        } else {
           setError(errorMessage);
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary/30">
      <VerifyEmailModal 
         isOpen={showVerifyModal}
         onClose={() => setShowVerifyModal(false)}
         email={formData.email}
      />
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full"></div>
      
      <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <Link href="/">
             <Image src="/images/logo-jd-color.svg" alt="JD" width={100} height={60} className="mb-4" />
          </Link>
          <h1 className="text-4xl font-title font-black tight-tracking uppercase text-foreground">
            Bon <span className="text-primary">Retour</span>
          </h1>
          <p className="text-muted-text text-[12px] font-medium tracking-[0.0em]">Accédez à votre espace personnel</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-red-500">Erreur d'accès</p>
              <p className="text-[10px] font-medium opacity-80 uppercase tracking-tight">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="relative group">
               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-primary transition-colors" size={18} />
               <input
                type="email"
                required
                placeholder="Adresse e-mail"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-card border border-card-border rounded-2xl py-4 pl-12 pr-6 text-[12px] font-medium tracking-wider text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
              />
            </div>
            
            <div className="relative group">
               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-primary transition-colors" size={18} />
               <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-card border border-card-border rounded-2xl py-4 pl-12 pr-12 text-[12px] font-medium tracking-wider text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-text hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-[0.0em] rounded-2xl hover:bg-primary/80 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                Se Connecter <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-card-border"></div>
          <span className="flex-shrink-0 mx-4 text-muted-text text-[9px] font-black uppercase tracking-widest">OU</span>
          <div className="flex-grow border-t border-card-border"></div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full py-4 bg-card border border-card-border text-foreground font-black text-xs uppercase tracking-[0.02em] rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-3"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264,51.509 C -3.264,50.719 -3.334,49.969 -3.454,49.239 L -14.754,49.239 L -14.754,53.749 L -8.284,53.749 C -8.574,55.229 -9.424,56.479 -10.684,57.329 L -10.684,60.329 L -6.824,60.329 C -4.564,58.239 -3.264,55.159 -3.264,51.509 z"/>
              <path fill="#34A853" d="M -14.754,63.239 C -11.514,63.239 -8.804,62.159 -6.824,60.329 L -10.684,57.329 C -11.764,58.049 -13.134,58.489 -14.754,58.489 C -17.884,58.489 -20.534,56.379 -21.484,53.529 L -25.464,53.529 L -25.464,56.619 C -23.494,60.539 -19.444,63.239 -14.754,63.239 z"/>
              <path fill="#FBBC05" d="M -21.484,53.529 C -21.734,52.809 -21.864,52.039 -21.864,51.239 C -21.864,50.439 -21.724,49.669 -21.484,48.949 L -21.484,45.859 L -25.464,45.859 C -26.284,47.479 -26.754,49.299 -26.754,51.239 C -26.754,53.179 -26.284,54.999 -25.464,56.619 L -21.484,53.529 z"/>
              <path fill="#EA4335" d="M -14.754,43.989 C -12.984,43.989 -11.404,44.599 -10.154,45.789 L -6.734,41.939 C -8.804,40.009 -11.514,39.239 -14.754,39.239 C -19.444,39.239 -23.494,41.939 -25.464,45.859 L -21.484,48.949 C -20.534,46.099 -17.884,43.989 -14.754,43.989 z"/>
            </g>
          </svg>
          Se connecter avec Google
        </button>

        <div className="flex flex-col items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
           <p className="text-muted-text">Pas encore de compte ?</p>
           <Link href="/register" className="text-primary hover:underline underline-offset-4">
              Créer un accès premium
           </Link>
        </div>
      </div>

      <div className="mt-10 bottom-10 flex items-center gap-3 text-gray-700">
         <ShieldCheck size={16} />
         <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Sécurité Bancaire FINTECH</p>
      </div>
    </div>
  );
}
