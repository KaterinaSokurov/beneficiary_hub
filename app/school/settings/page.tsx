import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SchoolSettingsPage } from "@/components/school/school-settings-page";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function SettingsPage() {
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

  // Get school details
  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!school) {
    redirect("/school");
  }

  return (
      <DashboardLayout
          role="school"
          userName={profile.full_name || profile.email}
          userEmail={profile.email}
        >
    <SchoolSettingsPage
      school={school as any}
      profile={profile as any}
    /></DashboardLayout>
  );
}
