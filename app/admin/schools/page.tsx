import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SchoolApprovalsPage } from "@/components/admin/school-approvals-page";

export default async function AdminSchoolsPage() {
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
    redirect(`/${profile?.role || "login"}`);
  }

  // Get pending schools count
  const { count: pendingCount } = await supabase
    .from("schools")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "pending");

  return (
    <DashboardLayout
      role="admin"
      userName={profile.full_name || profile.email}
      userEmail={profile.email}
      pendingCount={pendingCount || 0}
    >
      <SchoolApprovalsPage />
    </DashboardLayout>
  );
}
