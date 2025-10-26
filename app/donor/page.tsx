import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function DonorDashboard() {
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

  if (!profile || profile.role !== "donor") {
    redirect(`/${profile?.role || "login"}`);
  }

  // Check if donor details exist in donors table
  const { data: donorData } = await supabase
    .from("donors")
    .select("*")
    .eq("id", user.id)
    .single();

  // If no donor details, redirect to registration
  if (!donorData) {
    redirect("/auth/register-donor");
  }

  // If not verified, redirect to pending page
  if (!donorData.is_verified || donorData.verification_status === "pending") {
    redirect("/donor/pending");
  }

  // If rejected, sign out and redirect to login
  if (donorData.verification_status === "rejected") {
    await supabase.auth.signOut();
    redirect("/auth/login?error=rejected");
  }

  // Get donation statistics
  const [
    { count: totalDonations },
    { count: pendingApproval },
    { count: activeDonations },
    { count: completedDonations }
  ] = await Promise.all([
    supabase.from("donations").select("*", { count: "exact", head: true }).eq("donor_id", user.id),
    supabase.from("donations").select("*", { count: "exact", head: true }).eq("donor_id", user.id).eq("approval_status", "pending"),
    supabase.from("donations").select("*", { count: "exact", head: true }).eq("donor_id", user.id).in("status", ["approved", "allocated"]),
    supabase.from("donations").select("*", { count: "exact", head: true }).eq("donor_id", user.id).eq("status", "delivered")
  ]);

  return (
    <DashboardLayout
      role="donor"
      userName={donorData.full_name || profile.email}
      userEmail={profile.email}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Donor Dashboard</h2>
            <p className="text-gray-500 mt-2">
              List your resources and track your contributions
            </p>
          </div>
          <Link href="/donor/donations/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Donation
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                My Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDonations || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total resource listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApproval || 0}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting admin review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDonations || 0}</div>
              <p className="text-xs text-muted-foreground">
                Matched with schools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedDonations || 0}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>List New Resource</CardTitle>
              <CardDescription>
                Submit a new donation for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Share resources like food, textbooks, stationery, furniture, and more with schools in need
              </p>
              <Link href="/donor/donations/new">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Donation
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Donations History</CardTitle>
              <CardDescription>
                Track your contribution impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View past donations, schools helped, and delivery status
              </p>
              <Link href="/donor/donations">
                <Button variant="outline" className="w-full">
                  View All Donations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
