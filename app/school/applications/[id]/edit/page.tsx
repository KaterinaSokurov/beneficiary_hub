import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResourceApplicationForm } from "@/components/school/resource-application-form";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Fetch the application
  const { data: application, error } = await supabase
    .from("resource_applications")
    .select("*")
    .eq("id", id)
    .eq("school_id", user.id)
    .single();

  if (error || !application) {
    redirect("/school/applications");
  }

  // Only allow editing draft or rejected applications
  if (!["draft", "rejected"].includes(application.status)) {
    redirect("/school/applications");
  }

  return (
    <DashboardLayout
      role="school"
      userName={profile.full_name || profile.email}
      userEmail={profile.email}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Resource Application</h1>
          <p className="text-muted-foreground mt-2">
            Update your resource request
          </p>
        </div>

        <ResourceApplicationForm
          schoolId={user.id}
          existingApplication={application}
          isEdit={true}
        />
      </div>
    </DashboardLayout>
  );
}
