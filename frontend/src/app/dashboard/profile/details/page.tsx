"use client";

import { useSession, signOut } from "next-auth/react";
import { User, Mail, ShieldCheck, ArrowLeft, Camera, Edit3, Smartphone, MapPin, Key, Loader2, Wallet, LogOut, Moon, Sun, Monitor } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const userId = (session?.user as any)?.id;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    kycVerified: false,
    hasDeposited: false,
    isInstalled: false,
    iban: "",
    bankName: ""
  });

  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/auth/status/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setProfileData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: session?.user?.email || "",
            phone: data.phone || "",
            address: data.address || "",
            kycVerified: data.kycVerified,
            hasDeposited: data.hasDeposited,
            isInstalled: data.isInstalled,
            iban: data.iban || "",
            bankName: data.bankName || ""
          });
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (session) fetchProfile();
  }, [session, userId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          address: profileData.address,
        })
      });

      if (res.ok) {
        await updateSession({
           ...session,
           user: {
             ...session?.user,
             name: `${profileData.firstName} ${profileData.lastName}`
           }
        });
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error saving profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  if (!session) return null;
  if (isLoading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard/profile" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-muted-text hover:text-foreground transition-colors mb-4">
             <ArrowLeft size={12} /> Tableau de Bord
          </Link>
          <h1 className="text-4xl font-title font-bold tight-tracking uppercase leading-none">
            Mon <span className="text-primary">Compte</span>
          </h1>
          <p className="text-muted-text font-bold uppercase tracking-wider text-[9px] flex items-center gap-2">
            Gérez vos informations personnelles et votre sécurité
          </p>
        </div>
        
        <button 
          onClick={toggleEdit}
          disabled={isSaving}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 ${isEditing ? 'bg-primary text-white shadow-primary/20' : 'bg-white/5 border border-card-border text-white hover:bg-white/10'}`}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />} {isEditing ? "Enregistrer" : "Modifier"}
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Sidebar - Profile Card */}
         <div className="md:col-span-1 space-y-6">
            <div className="bg-card border border-card-border rounded-[2.5rem] p-8 flex flex-col items-center text-center relative overflow-hidden">
               <div className="absolute top-0 w-full h-32 bg-primary/10"></div>
               
               <div className="relative mb-6 group cursor-pointer mt-8">
                  <div className="w-24 h-24 rounded-full bg-background border-4 border-[#0c0c0c] flex items-center justify-center text-foreground/50 text-2xl font-black shadow-xl overflow-hidden relative">
                     {profileData.firstName ? profileData.firstName.charAt(0).toUpperCase() : "U"}
                     {isEditing && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Camera size={20} className="text-foreground" />
                        </div>
                     )}
                  </div>
                  {profileData.kycVerified && (
                     <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-[#0c0c0c] flex items-center justify-center shadow-lg">
                        <ShieldCheck size={14} className="text-foreground" />
                     </div>
                  )}
               </div>

               <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">{`${profileData.firstName} ${profileData.lastName}`.trim() || "Utilisateur"}</h2>
               <p className="text-[10px] text-muted-text font-bold uppercase tracking-wider mt-1">Membre Élite</p>
               
               <div className="w-full h-px bg-white/5 my-6"></div>

               <div className="w-full space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                     <span className="text-muted-text">Statut KYC</span>
                     <span className={profileData.kycVerified ? "text-green-500" : "text-amber-500"}>{profileData.kycVerified ? "Vérifié" : "En attente"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                     <span className="text-muted-text">Dépôt Initial</span>
                     <span className={profileData.hasDeposited ? "text-green-500" : "text-amber-500"}>{profileData.hasDeposited ? "Effectué" : "Requis"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                     <span className="text-muted-text">Application PWA</span>
                     <span className={profileData.isInstalled ? "text-green-500" : "text-muted-text"}>{profileData.isInstalled ? "Installée" : "Non installée"}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Main Content - Forms */}
         <div className="md:col-span-2 space-y-6">
            <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8">
               <div className="flex items-center gap-3 border-b border-card-border pb-4">
                  <User size={18} className="text-primary" />
                  <h3 className="font-title font-bold text-lg tracking-wider uppercase">Informations Personnelles</h3>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Prénom</label>
                     <input 
                        type="text" 
                        disabled={!isEditing}
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Nom</label>
                     <input 
                        type="text" 
                        disabled={!isEditing}
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Adresse Email</label>
                     <input 
                        type="email" 
                        disabled={true} // Email should usually require a specific flow to change
                        value={profileData.email}
                        className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 text-xs text-foreground/50 focus:outline-none focus:border-primary/50 transition-colors opacity-50 cursor-not-allowed"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Téléphone</label>
                     <input 
                        type="tel" 
                        disabled={!isEditing}
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="Non renseigné"
                        className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
                     />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                     <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Adresse Principale</label>
                     <input 
                        type="text" 
                        disabled={!isEditing}
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        placeholder="Renseignée via KYC"
                        className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
                     />
                  </div>
               </div>
            </div>

            <div className="bg-card border border-card-border rounded-[2.5rem] p-8 space-y-8">
               <div className="flex items-center gap-3 border-b border-card-border pb-4">
                  <Wallet size={18} className="text-primary" />
                  <h3 className="font-title font-bold text-lg tracking-wider uppercase">Coordonnées Bancaires</h3>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">Nom de la Banque</label>
                     <input 
                        type="text" 
                        disabled={true}
                        value={profileData.bankName || "Non renseigné"}
                        className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 text-xs text-foreground/70 focus:outline-none transition-colors disabled:opacity-50 cursor-not-allowed uppercase"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-muted-text uppercase tracking-wider ml-1">IBAN</label>
                     <input 
                        type="text" 
                        disabled={true}
                        value={profileData.iban || "Non renseigné"}
                        className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 text-xs text-foreground/70 focus:outline-none transition-colors disabled:opacity-50 cursor-not-allowed uppercase"
                     />
                  </div>
                  <p className="text-[9px] font-black text-muted-text uppercase tracking-wider sm:col-span-2">Ces informations sont mises à jour automatiquement lors de vos retraits.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
