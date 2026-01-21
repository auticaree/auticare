import NextAuth from "next-auth";
import type { Role } from "@prisma/client";

// This is a lightweight auth configuration for middleware only
// It doesn't use Prisma or bcrypt - just validates JWT tokens
export const { auth: authMiddleware } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  providers: [], // No providers needed for middleware - just JWT validation
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  // Trust the token from the main auth config
  trustHost: true,
});
