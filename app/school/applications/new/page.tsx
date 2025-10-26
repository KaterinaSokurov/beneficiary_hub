import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResourceApplicationForm } from "@/components/school/resource-application-form";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function NewApplicationPage() {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">New Resource Application</h1>
          <p className="text-muted-foreground mt-2">
            Submit a request for resources your school needs
          </p>
        </div>

        <ResourceApplicationForm schoolId={user.id} />
      </div>
    </DashboardLayout>
  );
}
