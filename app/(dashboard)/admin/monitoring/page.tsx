import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MonitoringClient from "./monitoring-client";

export default async function MonitoringPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Only admins can access monitoring
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <MonitoringClient />;
}
