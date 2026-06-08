import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's role for proper redirect
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { role: true },
  });

  const roleRedirectMap: Record<string, string> = {
    admin: "/admin",
    team_leader: "/team-leader",
    supervisor: "/supervisor",
    assistant: "/assistant",
    permanent_worker: "/worker",
    adhoc_worker: "/worker",
  };

  const destination =
    dbUser ? (roleRedirectMap[dbUser.role.name] ?? "/worker") : "/login";

  redirect(destination);
}
