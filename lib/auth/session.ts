import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { cache } from "react";

export type SessionUser = User & {
  role: {
    name: string;
    displayName: string;
    permissions: Record<string, boolean>;
  };
  warehouse?: { id: string; name: string; code: string } | null;
  cluster?: { id: string; name: string; code: string } | null;
};

// 1. Cache the Supabase Auth user check (returns data only, no redirects, uses local cookie session decoding)
const getCachedAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
});

// 2. Cache the database user query (returns data only, no redirects)
const getCachedDbUser = cache(async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      warehouse: { select: { id: true, name: true, code: true } },
      cluster: { select: { id: true, name: true, code: true } },
    },
  });
});

/**
 * Gets the current authenticated user with their role and permissions.
 * Throws a redirect to /login if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser> {
  const authUser = await getCachedAuthUser();
  if (!authUser) {
    redirect("/login");
  }

  const dbUser = await getCachedDbUser(authUser.id);
  if (!dbUser) {
    redirect("/login");
  }

  return dbUser as SessionUser;
}

/**
 * Gets the session user without redirecting.
 * Returns null if not authenticated.
 */
export async function getSessionUserSafe(): Promise<SessionUser | null> {
  try {
    const authUser = await getCachedAuthUser();
    if (!authUser) return null;

    const dbUser = await getCachedDbUser(authUser.id);
    return dbUser as SessionUser | null;
  } catch {
    return null;
  }
}
