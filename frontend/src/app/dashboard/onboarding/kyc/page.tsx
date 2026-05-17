"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShieldCheck, ArrowRight, CheckCircle2, Camera, X, FileText, Check, MapPin, Loader2 } from "lucide-react";

export default function KYCPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    address: "",
    birthDate: "",
    idType: "passport", // 'passport' or 'id_card'
  });

  // Redirection automatique si déjà vérifié
  useEffect(() => {
    const user = session?.user as any;
    if (user?.kycVerified) {
      router.replace("/dashboard/onboarding/deposit");
    }
  }, [session, router]);

  const [files, setFiles] = useState<{
    recto: File | null;
    verso: File | null;
    addressProof: File | null;
  }>({
    recto: null,
    verso: null,
    addressProof: null,
  });

  const [previews, setPreviews] = useState<{
    recto: string | null;
    verso: string | null;
    addressProof: string | null;
  }>({
    recto: null,
    verso: null,
    addressProof: null,
  });

  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'recto' | 'verso' | 'addressProof') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [side]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [side]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (side: 'recto' | 'verso' | 'addressProof') => {
    setFiles(prev => ({ ...prev, [side]: null }));
    setPreviews(prev => ({ ...prev, [side]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!previews.recto) {
        alert("Veuillez uploader le recto de votre document d'identité.");
        return;
    }
    if (formData.idType === 'id_card' && !previews.verso) {
        alert("Veuillez uploader le verso de votre carte d'identité.");
        return;
    }
    if (!previews.addressProof) {
        alert("Veuillez uploader un justificatif de domicile.");
        return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const userId = (session?.user as any)?.id;

      const res = await fetch(`${apiUrl}/api/auth/verify-kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...formData,
          recto: previews.recto,
          verso: previews.verso,
          addressProof: previews.addressProof
        }),
      });

      if (res.ok) {
        await update({ ...session, user: { ...session?.user, kycVerified: true } });
        setStep(3);
        setTimeout(() => {
          router.push("/dashboard/onboarding/deposit");
        }, 2500);
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Une erreur est survenue.");
      }
    } catch (error) {
      console.error("KYC error:", error);
      alert("Une erreur est survenue lors de la vérification.");
    } finally {
      setLoading(false);
    }
  };

  if ((session?.user as any)?.kycVerified) return null;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-card-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full"></div>
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 uppercase font-title">Vérification</h1>
              <p className="text-muted-text text-sm font-medium">Pour accéder au crédit de 80€, nous devons valider votre identité et votre adresse.</p>
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-card-border group hover:border-primary/30 transition-all">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">1</div>
                <div>
                   <p className="text-xs font-black uppercase tracking-widest text-foreground">Infos & Domicile</p>
                   <p className="text-[10px] text-muted-text font-bold uppercase tracking-tight">Adresse et justificatif</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-card-border opacity-50">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-foreground/50 font-bold text-xs">2</div>
                <div>
                   <p className="text-xs font-black uppercase tracking-widest text-foreground">Identité</p>
                   <p className="text-[10px] text-muted-text font-bold uppercase tracking-tight">Passeport ou Carte d'Identité</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group uppercase text-xs tracking-widest shadow-xl shadow-white/5"
            >
              Commencer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Validation</h2>
               <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">Étape 2/2</span>
            </div>
            
            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Naissance</label>
                    <input
                      type="date"
                      required
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full h-[48px] bg-background border border-card-border rounded-xl px-4 py-3 text-[12px] text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Document</label>
                    <select
                      value={formData.idType}
                      onChange={(e) => {
                        setFormData({ ...formData, idType: e.target.value });
                        if (e.target.value === 'passport') {
                            setFiles(prev => ({ ...prev, verso: null }));
                            setPreviews(prev => ({ ...prev, verso: null }));
                        }
                      }}
                      className="w-full h-[48px] bg-background border border-card-border rounded-xl px-4 py-3 text-[12px] text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                    >
                      <option value="passport">Passeport</option>
                      <option value="id_card">Carte d'ID</option>
                    </select>
                  </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Adresse complète</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="Rue, Code Postal, Ville"
                />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Justificatif de domicile</label>
                 <input type="file" hidden ref={addressInputRef} accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'addressProof')} />
                 <div 
                    onClick={() => addressInputRef.current?.click()}
                    className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-all ${previews.addressProof ? 'border-primary/50 bg-primary/5' : 'border-card-border bg-background hover:border-primary/30'}`}
                 >
                    {previews.addressProof ? (
                        <div className="flex items-center gap-2 text-primary">
                            <Check size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Document chargé</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-text">
                            <MapPin size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Facture ou Quittance</span>
                        </div>
                    )}
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Identité ({formData.idType === 'id_card' ? 'Recto/Verso' : 'Recto'})</label>
                <div className={`grid ${formData.idType === 'id_card' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                    <div className="relative group">
                        <input type="file" accept="image/*" hidden ref={rectoInputRef} onChange={(e) => handleFileChange(e, 'recto')} />
                        <div 
                            onClick={() => rectoInputRef.current?.click()}
                            className={`aspect-[16/10] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all overflow-hidden relative ${previews.recto ? 'border-primary/50 bg-primary/5' : 'border-card-border bg-background hover:border-primary/30'}`}
                        >
                            {previews.recto ? (
                                <>
                                    <img src={previews.recto} alt="Recto" className="w-full h-full object-cover" />
                                    <button type="button" onClick={(e) => { e.stopPropagation(); removeFile('recto'); }} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"><X size={10} /></button>
                                </>
                            ) : (
                                <Camera className="w-5 h-5 text-muted-text" />
                            )}
                        </div>
                    </div>

                    {formData.idType === 'id_card' && (
                        <div className="relative group">
                            <input type="file" accept="image/*" hidden ref={versoInputRef} onChange={(e) => handleFileChange(e, 'verso')} />
                            <div 
                                onClick={() => versoInputRef.current?.click()}
                                className={`aspect-[16/10] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all overflow-hidden relative ${previews.verso ? 'border-primary/50 bg-primary/5' : 'border-card-border bg-background hover:border-primary/30'}`}
                            >
                                {previews.verso ? (
                                    <>
                                        <img src={previews.verso} alt="Verso" className="w-full h-full object-cover" />
                                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile('verso'); }} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"><X size={10} /></button>
                                    </>
                                ) : (
                                    <Camera className="w-5 h-5 text-muted-text" />
                                )}
                            </div>
                        </div>
                    )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary text-white font-black rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Finaliser la vérification"}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-10 space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <CheckCircle2 className="w-10 h-10 text-green-500 relative z-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Vérification en cours</h2>
              <p className="text-muted-text text-[10px] font-bold uppercase tracking-widest px-4 leading-relaxed">Vos documents sont en cours d'analyse. Redirection vers l'étape finale...</p>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-6 max-w-[150px] mx-auto">
              <div className="h-full bg-green-500 animate-[loading_2.5s_ease-in-out]"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
