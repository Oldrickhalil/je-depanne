"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./ui/ToastProvider";
import { ThemeProvider } from "next-themes";
import { SearchProvider } from "@/context/SearchContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <ToastProvider>
          <SearchProvider>
            {children}
          </SearchProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
