import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  ArrowRight,
} from "lucide-react";

export default async function SchoolDashboard() {
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

  // Fetch real statistics
  const [
    { count: totalApplications },
    { count: draftApplications },
    { count: submittedApplications },
    { count: approvedApplications },
    { count: rejectedApplications },
    { count: fulfilledApplications },
  ] = await Promise.all([
    supabase.from("resource_applications").select("*", { count: "exact", head: true }).eq("school_id", user.id),
    supabase.from("resource_applications").select("*", { count: "exact", head: true }).eq("school_id", user.id).eq("status", "draft"),
    supabase.from("resource_applications").select("*", { count: "exact", head: true }).eq("school_id", user.id).eq("status", "submitted"),
    supabase.from("resource_applications").select("*", { count: "exact", head: true }).eq("school_id", user.id).eq("status", "approved"),
    supabase.from("resource_applications").select("*", { count: "exact", head: true }).eq("school_id", user.id).eq("status", "rejected"),
    supabase.from("resource_applications").select("*", { count: "exact", head: true }).eq("school_id", user.id).eq("status", "fulfilled"),
  ]);

  return (
    <DashboardLayout
      role="school"
      userName={profile.full_name || profile.email}
      userEmail={profile.email}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">School Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Manage your resource applications and track their progress
            </p>
          </div>
          <Link href="/school/applications/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground">
                All resource requests
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Edit className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">{draftApplications || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                Incomplete applications
              </p>
              {(draftApplications || 0) > 0 && (
                <Link href="/school/applications">
                  <Button variant="link" className="h-auto p-0 mt-2 text-gray-700">
                    Continue editing <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{submittedApplications || 0}</div>
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
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-2">
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
              {(rejectedApplications || 0) > 0 && (
                <Link href="/school/applications">
                  <Button variant="link" className="h-auto p-0 mt-2 text-red-700">
                    Revise applications <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fulfilled</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{fulfilledApplications || 0}</div>
              <p className="text-xs text-purple-600 mt-1">
                Successfully completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/school/applications/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Application
                </Button>
              </Link>
              <Link href="/school/applications" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Applications
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Status Guide</CardTitle>
              <CardDescription>
                Understanding your application lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Edit className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div>
                    <span className="font-medium">Draft:</span> Application not yet submitted
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-medium">Submitted:</span> Under review by approvers
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <span className="font-medium">Approved:</span> Application approved, awaiting donors
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <span className="font-medium">Rejected:</span> Application needs revision
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
