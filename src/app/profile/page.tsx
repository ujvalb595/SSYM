import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id || session.user.isActive === false) redirect("/login");
  redirect(`/members/${session.user.id}`);
}
