import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { UserManagementPage } from "@/components/admin/user-management-page";

export default async function AdminUsersPage() {
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

  // Fetch all users using admin client to bypass RLS
  const adminClient = createAdminClient();
  const { data: users } = await adminClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout
      role="admin"
      userName={profile.full_name || profile.email}
      userEmail={profile.email}
    >
      <UserManagementPage users={users || []} />
    </DashboardLayout>
  );
}
