import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Shield, CheckCircle, AlertCircle } from "lucide-react";

export default async function ApproverDashboard() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

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

  if (!profile || (profile.role !== "approver" && profile.role !== "admin")) {
    redirect(`/${profile?.role || "login"}`);
  }

  // Get donation statistics
  const [
    { count: pendingFinalApproval },
    { count: approvedToday },
    { count: totalApproved }
  ] = await Promise.all([
    adminClient.from("donations").select("*", { count: "exact", head: true }).eq("approval_status", "pending_final_approval"),
    adminClient.from("donations").select("*", { count: "exact", head: true }).eq("approval_status", "approved").gte("approved_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    adminClient.from("donations").select("*", { count: "exact", head: true }).eq("approval_status", "approved")
  ]);

  return (
    <DashboardLayout
      role="approver"
      userName={profile.full_name || profile.email}
      userEmail={profile.email}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Approver Dashboard</h2>
          <p className="text-gray-500 mt-2">
            Provide final approval for donations to prevent bias
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Final Approval
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{pendingFinalApproval || 0}</div>
              <p className="text-xs text-muted-foreground">
                Donations awaiting your review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Approved Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedToday || 0}</div>
              <p className="text-xs text-muted-foreground">
                Donations approved today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Approved
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApproved || 0}</div>
              <p className="text-xs text-muted-foreground">
                All-time approved donations
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Two-Tier Approval System</CardTitle>
              <CardDescription>
                Your role in preventing bias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  As the final approver, you provide an independent review of donations after admin pre-approval. This ensures:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Unbiased decision making</li>
                  <li>Prevention of favoritism</li>
                  <li>Quality control and consistency</li>
                  <li>Fair treatment of all donors</li>
                </ul>
                <Link href="/approver/donations">
                  <Button className="w-full mt-4 gap-2">
                    <Shield className="h-4 w-4" />
                    Review Pending Donations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
              <CardDescription>
                How the process works
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="text-sm font-medium">Donor submits donation</p>
                    <p className="text-xs text-muted-foreground">Status: Pending</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="text-sm font-medium">Admin pre-approves</p>
                    <p className="text-xs text-muted-foreground">Status: Pending Final Approval</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="text-sm font-medium">You give final approval</p>
                    <p className="text-xs text-muted-foreground">Status: Approved</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
