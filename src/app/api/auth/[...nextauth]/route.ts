import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// authOptions lives in @/lib/auth so server components / other route handlers
// (e.g. /api/github/repos) can import it for getServerSession.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
