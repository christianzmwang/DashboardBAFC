import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Allowlist of email domains (comma-separated in env). Example: ALLOWED_EMAIL_DOMAINS="allvitr.com,anotherdomain.com"
// Defaults to ["allvitr.com"] if env var is not set, per request to grant access to that domain.
// If ALLOWED_EMAIL_DOMAINS is unset, default to both primary domains.
const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "allvitr.com,bayareafencing.club")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Always show the Google account chooser on sign-in
      authorization: {
        params: {
          prompt: "select_account",
          ...(allowedDomains.length === 1 ? { hd: allowedDomains[0] } : {}),
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user?.email?.toLowerCase();
      const hd = (profile as any)?.hd ? String((profile as any).hd).toLowerCase() : undefined;

      // If Google reports a hosted domain and it's allowed, accept immediately
      if (account?.provider === "google" && hd && allowedDomains.includes(hd)) {
        return true;
      }

      if (!email) return false; // no email -> deny
      // Allow if the email ends with any allowed domain (covers aliases)
      const isAllowed = allowedDomains.some((domain) => email.endsWith(`@${domain}`));
      return isAllowed;
    },
    async redirect() {
      // Always land on home after auth
      return "/";
    },
  },
  // session: { strategy: 'jwt' },
});

export { handler as GET, handler as POST };
