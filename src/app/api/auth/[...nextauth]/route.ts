import NextAuth, { type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET ?? "dev-secret-change-me",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.githubId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from the provider
      if (session.user) {
        (session.user as Record<string, unknown>).accessToken = token.accessToken;
        (session.user as Record<string, unknown>).githubId = token.githubId;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Optionally upsert user in database on sign in
      try {
        if (account?.provider === "github" && profile) {
          const existingUser = await db.user.findUnique({
            where: { githubId: parseInt(account.providerAccountId) },
          });

          if (!existingUser) {
            await db.user.create({
              data: {
                githubId: parseInt(account.providerAccountId),
                login: profile.login as string ?? user.email?.split("@")[0] ?? "user",
                email: user.email,
                name: user.name,
                avatarUrl: user.image,
                accessToken: account.access_token,
              },
            });
          } else {
            await db.user.update({
              where: { githubId: parseInt(account.providerAccountId) },
              data: {
                login: profile.login as string ?? existingUser.login,
                email: user.email ?? existingUser.email,
                name: user.name ?? existingUser.name,
                avatarUrl: user.image ?? existingUser.avatarUrl,
                accessToken: account.access_token ?? existingUser.accessToken,
              },
            });
          }
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return true; // Still allow sign in even if DB update fails
      }
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};

// db imported at top of file

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
