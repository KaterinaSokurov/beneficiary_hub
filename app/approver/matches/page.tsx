import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { MatchApprovalInterface } from "@/components/approver/match-approval-interface";

export default async function ApproverMatchesPage() {
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

  if (!profile || !["approver", "admin"].includes(profile.role)) {
    redirect(`/${profile?.role || "login"}`);
  }

  return (
    <DashboardLayout
      role="approver"
      userName={profile.full_name || profile.email}
      userEmail={profile.email}
    >
      <MatchApprovalInterface />
    </DashboardLayout>
  );
}
