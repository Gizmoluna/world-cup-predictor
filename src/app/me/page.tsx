import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

// "Me" tab → your own profile (badges, level, pick history live there).
export default async function MePage() {
  const id = await getSessionUserId();
  redirect(id ? `/profile/${id}` : "/");
}
