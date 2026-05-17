import type { Metadata, Viewport } from "next";
import AdminGuard from "./AdminGuard";

export const viewport: Viewport = {
  themeColor: "#050505",
};

export const metadata: Metadata = {
  title: "JD Admin | Console de Gestion",
  description: "Accès restreint aux administrateurs Je Dépanne",
  manifest: "/admin-manifest.json",
  icons: {
    icon: "/images/admin_icon.svg",
    apple: "/images/admin_icon.svg",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      {children}
    </AdminGuard>
  );
}
