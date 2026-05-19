import { AdminDashboard } from "@/components/admin-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
