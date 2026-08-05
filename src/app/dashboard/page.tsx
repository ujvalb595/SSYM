import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.isActive) redirect("/login");
  return <DashboardShell />;
}
