import { type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { db } from "@/lib/db";

/**
 * NextAuth (GitHub OAuth) configuration.
 *
 * Scope note: we request `repo` in addition to `read:user user:email` so the
 * user's OAuth access token can list their repositories (public + private) via
 * GET /user/repos. Changing the scope requires the user to sign out and sign in
 * again to mint a fresh token with the new grant.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET ?? "dev-secret-change-me",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access token + GitHub identity onto the JWT.
      if (account) {
        token.accessToken = account.access_token;
        token.githubId = account.providerAccountId;
      }
      if (profile) {
        const p = profile as { login?: string; avatar_url?: string; name?: string };
        if (p.login) (token as Record<string, unknown>).login = p.login;
        if (p.avatar_url) token.picture = p.avatar_url;
        token.name = p.name ?? p.login ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as Record<string, unknown>;
        u.accessToken = token.accessToken;
        u.githubId = token.githubId;
        u.login = (token as Record<string, unknown>).login;
        if (token.picture) u.image = token.picture;
        if (token.name) u.name = token.name;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Upsert the GitHub user into the database on sign in.
      try {
        if (account?.provider === "github" && profile) {
          const ghProfile = profile as { login?: string };
          const existingUser = await db.user.findUnique({
            where: { githubId: parseInt(account.providerAccountId) },
          });

          if (!existingUser) {
            await db.user.create({
              data: {
                githubId: parseInt(account.providerAccountId),
                login: ghProfile.login ?? user.email?.split("@")[0] ?? "user",
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
                login: ghProfile.login ?? existingUser.login,
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
