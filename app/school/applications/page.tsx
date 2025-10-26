import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResourceApplicationsPage } from "@/components/school/resource-applications-page";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function ApplicationsPage() {
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

  if (!profile || profile.role !== "school") {
    redirect(`/${profile?.role || "login"}`);
  }

  if (!profile.is_active) {
    redirect("/school/pending");
  }

  return (
    <DashboardLayout
      role="school"
      userName={profile.full_name || profile.email}
      userEmail={profile.email}
    >
      <ResourceApplicationsPage schoolId={user.id} />x
    </DashboardLayout>
  );
}
