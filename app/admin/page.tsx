import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  School,
  Heart,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  FileText,
  AlertCircle,
  Package,
} from "lucide-react";

export default async function AdminDashboard() {
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

  // Use admin client for accurate statistics
  const adminClient = createAdminClient();

  // Fetch real statistics using service role
  const [
    { count: totalUsers },
    { count: totalSchools },
    { count: pendingSchools },
    { count: approvedSchools },
    { count: rejectedSchools },
    { count: totalDonors },
    { count: pendingDonors },
    { count: approvedDonors },
    { count: rejectedDonors },
    { count: activeApprovers },
    { data: schoolProfiles },
    { count: totalApplications },
    { count: pendingApplications },
    { count: approvedApplications },
    { count: rejectedApplications },
    { count: totalDonations },
    { count: pendingDonations },
    { count: approvedDonations },
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("schools").select("*", { count: "exact", head: true }),
    adminClient.from("schools").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
    adminClient.from("schools").select("*", { count: "exact", head: true }).eq("approval_status", "approved"),
    adminClient.from("schools").select("*", { count: "exact", head: true }).eq("approval_status", "rejected"),
    adminClient.from("donors").select("*", { count: "exact", head: true }),
    adminClient.from("donors").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    adminClient.from("donors").select("*", { count: "exact", head: true }).eq("verification_status", "approved"),
    adminClient.from("donors").select("*", { count: "exact", head: true }).eq("verification_status", "rejected"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "approver").eq("is_active", true),
    adminClient.from("profiles").select("id").eq("role", "school"),
    adminClient.from("resource_applications").select("*", { count: "exact", head: true }),
    adminClient.from("resource_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    adminClient.from("resource_applications").select("*", { count: "exact", head: true }).eq("status", "approved"),
    adminClient.from("resource_applications").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    adminClient.from("donations").select("*", { count: "exact", head: true }),
    adminClient.from("donations").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
    adminClient.from("donations").select("*", { count: "exact", head: true }).eq("approval_status", "approved"),
  ]);

  // Get school IDs that have completed registration
  const { data: completedSchoolIds } = await adminClient
    .from("schools")
    .select("id");

  const completedIds = new Set(completedSchoolIds?.map((s) => s.id) || []);
  const incompleteRegistrations = schoolProfiles?.filter(
    (profile) => !completedIds.has(profile.id)
  ).length || 0;

  // Calculate totals for action items
  const totalPendingActions = (pendingSchools || 0) + (pendingDonors || 0) + (pendingApplications || 0);

  return (
    <DashboardLayout
      role="admin"
      userName={profile.full_name || profile.email}
      userEmail={profile.email}
      pendingCount={pendingSchools || 0}
      pendingDonorsCount={pendingDonors || 0}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Platform overview and management
            </p>
          </div>
          {totalPendingActions > 0 && (
            <Badge variant="destructive" className="h-8 px-4 text-base">
              {totalPendingActions} Action{totalPendingActions !== 1 ? 's' : ''} Required
            </Badge>
          )}
        </div>

        {/* Action Items - Only show if there are pending items */}
        {totalPendingActions > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                Items Requiring Your Attention
              </CardTitle>
              <CardDescription>
                Please review and take action on the following pending items
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {(pendingSchools || 0) > 0 && (
                <Link href="/admin/schools" className="block">
                  <div className="flex items-center justify-between p-4 border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-200 rounded-full">
                        <School className="h-5 w-5 text-yellow-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-900">{pendingSchools} School{pendingSchools !== 1 ? 's' : ''}</p>
                        <p className="text-sm text-yellow-700">Awaiting approval</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-yellow-700" />
                  </div>
                </Link>
              )}

              {(pendingDonors || 0) > 0 && (
                <Link href="/admin/donors" className="block">
                  <div className="flex items-center justify-between p-4 border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-200 rounded-full">
                        <Heart className="h-5 w-5 text-yellow-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-900">{pendingDonors} Donor{pendingDonors !== 1 ? 's' : ''}</p>
                        <p className="text-sm text-yellow-700">Awaiting verification</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-yellow-700" />
                  </div>
                </Link>
              )}

              {(pendingApplications || 0) > 0 && (
                <div className="flex items-center justify-between p-4 border border-yellow-300 rounded-lg opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-200 rounded-full">
                      <FileText className="h-5 w-5 text-yellow-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-yellow-900">{pendingApplications} Application{pendingApplications !== 1 ? 's' : ''}</p>
                      <p className="text-sm text-yellow-700">Pending review</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Overview Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Platform Overview</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                All registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSchools || 0}</div>
              <p className="text-xs text-muted-foreground">
                All school registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDonors || 0}</div>
              <p className="text-xs text-muted-foreground">
                All donor registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Approvers</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeApprovers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active platform approvers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDonations || 0}</div>
              <p className="text-xs text-muted-foreground">
                {pendingDonations || 0} pending approval
              </p>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Donor Approval Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Donor Approval Status</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{pendingDonors || 0}</div>
                <p className="text-xs text-yellow-600 mt-1">
                  Donors awaiting verification
                </p>
                {(pendingDonors || 0) > 0 && (
                  <Link href="/admin/donors">
                    <Button variant="link" className="h-auto p-0 mt-2 text-yellow-700">
                      Review now <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{approvedDonors || 0}</div>
                <p className="text-xs text-green-600 mt-1">
                  Verified and active donors
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{rejectedDonors || 0}</div>
                <p className="text-xs text-red-600 mt-1">
                  Failed verification
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* School Approval Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-4">School Approval Status</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-orange-200 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incomplete</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{incompleteRegistrations}</div>
                <p className="text-xs text-orange-600 mt-1">
                  Accounts without school details
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{pendingSchools || 0}</div>
                <p className="text-xs text-yellow-600 mt-1">
                  Schools awaiting approval
                </p>
                {(pendingSchools || 0) > 0 && (
                  <Link href="/admin/schools">
                    <Button variant="link" className="h-auto p-0 mt-2 text-yellow-700">
                      Review now <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{approvedSchools || 0}</div>
                <p className="text-xs text-green-600 mt-1">
                  Schools approved and active
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{rejectedSchools || 0}</div>
                <p className="text-xs text-red-600 mt-1">
                  Schools not approved
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resource Applications Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Resource Applications</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalApplications || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All resource requests
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{pendingApplications || 0}</div>
                <p className="text-xs text-blue-600 mt-1">
                  Awaiting review
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{approvedApplications || 0}</div>
                <p className="text-xs text-green-600 mt-1">
                  Applications approved
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{rejectedApplications || 0}</div>
                <p className="text-xs text-red-600 mt-1">
                  Applications rejected
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
