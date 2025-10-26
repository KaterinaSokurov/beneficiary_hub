import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DonorApprovalsPage } from "@/components/admin/donor-approvals-page";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function AdminDonorsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  // Get pending counts for notifications
  const adminClient = createAdminClient();
  const [
    { count: pendingSchools },
    { count: pendingDonors }
  ] = await Promise.all([
    adminClient.from("schools").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
    adminClient.from("donors").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
  ]);

  return  <DashboardLayout
        role="admin"
        userName={profile.full_name || profile.email}
        userEmail={profile.email}
        pendingCount={pendingSchools || 0}
        pendingDonorsCount={pendingDonors || 0}
      > <DonorApprovalsPage /></DashboardLayout>;
}
