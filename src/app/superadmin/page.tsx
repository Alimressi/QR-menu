import { SuperAdminDashboard } from "@/components/super-admin-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin",
};

export default function SuperAdminPage() {
  return <SuperAdminDashboard />;
}
