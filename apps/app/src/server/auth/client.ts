import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import { env } from "@/env";
import type { auth } from ".";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_DASHBOARD_APP_URL,
  plugins: [
    customSessionClient<typeof auth>(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
