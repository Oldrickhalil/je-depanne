import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" }
          });

          const data = await res.json();

          if (res.ok && data.user) {
            return {
              id: data.user.id,
              name: `${data.user.firstName} ${data.user.lastName}`,
              email: data.user.email,
              token: data.token,
              kycVerified: data.user.kycVerified,
              hasDeposited: data.user.hasDeposited,
              isInstalled: data.user.isInstalled,
              creditLimit: data.user.creditLimit
            };
          }
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || "jd_secret_fallback_123",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        token.kycVerified = session.user.kycVerified;
        token.hasDeposited = session.user.hasDeposited;
        token.isInstalled = session.user.isInstalled;
        token.creditLimit = session.user.creditLimit;
        token.name = session.user.name;
      }
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).token;
        token.kycVerified = (user as any).kycVerified;
        token.hasDeposited = (user as any).hasDeposited;
        token.isInstalled = (user as any).isInstalled;
        token.creditLimit = (user as any).creditLimit;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).kycVerified = token.kycVerified;
        (session.user as any).hasDeposited = token.hasDeposited;
        (session.user as any).isInstalled = token.isInstalled;
        (session.user as any).creditLimit = token.creditLimit;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
