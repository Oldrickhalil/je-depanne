import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center justify-center p-6 selection:bg-primary/30">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse-slow"></div>

      {/* Floating Logo / Brand */}
      <div className="mb-12 animate-in fade-in slide-in-from-top-8 duration-1000">
        <Image src="/images/logo-jd-color.svg" alt="Je Dépanne" width={180} height={100} className="drop-shadow-[0_0_30px_rgba(225,29,72,0.3)]" />
      </div>

      {/* Hero Content */}
      <main className="relative z-10 w-full max-w-4xl text-center space-y-10">
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-1000 delay-200">
           <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-card-border text-[10px] font-black uppercase tracking-[0.05em] text-primary mb-4">
              Micro-Crédit en 24h
           </span>
           <h1 className="text-6xl md:text-8xl font-title font-black tight-tracking uppercase leading-[0.85] text-foreground">
              Besoin <br/> <span className="text-primary">d'argent ?</span>
           </h1>
           <p className="text-muted-text text-lg md:text-xl uppercase font-medium tracking-[0.0em] max-w-2xl mx-auto leading-relaxed pt-4">
              Je Dépanne vous permet d'emprunter <span className="text-foreground">instantanément</span>. <br/>
              Empruntez jusqu'à <span className="text-primary font-black">10 000€</span> en un clic.
           </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <Link 
            href="/register" 
            className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black text-xs uppercase tracking-[0.0em] rounded-3xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
          >
            Créer un Compte
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-10 py-5 bg-card text-foreground border border-card-border font-black text-xs uppercase tracking-[0.0em] rounded-3xl hover:bg-white/5 hover:border-white/20 transition-all"
          >
            Se Connecter
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 animate-in fade-in duration-1000 delay-700">
           {[
             { src: "/images/validation-check-double.svg", val: "Rapide", desc: "Décision sous 24h" },
             { src: "/images/cash-payment-bag.svg", val: "15 000€", desc: "Limite crédit" },
             { src: "/images/security-user-lock.svg", val: "Sécurisé", desc: "Protection bancaire" }
           ].map((f, i) => (
             <div key={i} className="flex flex-col items-center space-y-1">
                <Image className="text-center mb-4" src={f.src} alt={f.val} width={40} height={40} />
                <p className="text-xl font-black uppercase text-foreground">{f.val}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.0em] text-primary/60">{f.desc}</p>
             </div>
           ))}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="mt-12 animate-in fade-in duration-1000 delay-1000 flex flex-col items-center gap-4">
        <Image src="/images/logo-jd-wh.svg" alt="Je Dépanne" width={100} height={60} className="opacity-50" />
        <p className="text-gray-700 text-[10px] font-bold uppercase tracking-[0.0em]">
          © 2026 JE DÉPANNE • PREMIUM FINTECH
        </p>
      </footer>
    </div>
  );
}
