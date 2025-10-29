import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, CheckCircle, XCircle, Truck, AlertCircle, User } from "lucide-react";
import { DonationApprovalActions } from "@/components/admin/donation-approval-actions";
import { DonorDetailsModal } from "@/components/admin/donor-details-modal";
import { DonationCardActions } from "@/components/admin/donation-card-actions";

export default async function AdminDonationsPage() {
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

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  // Get pending counts for notifications
  const [
    { count: pendingSchools },
    { count: pendingDonors }
  ] = await Promise.all([
    adminClient.from("schools").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
    adminClient.from("donors").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
  ]);

  // Fetch all donations with complete donor information
  const { data: allDonations } = await adminClient
    .from("donations")
    .select(`
      *,
      donors!donor_id(*)
    `)
    .order("created_at", { ascending: false });

  // Get emails from profiles for each donor
  const donorIds = allDonations?.map(d => (d.donors as any)?.id).filter(Boolean) || [];
  const { data: donorProfiles } = await adminClient
    .from("profiles")
    .select("id, email")
    .in("id", donorIds);

  // Merge email data into donors
  const donationsWithEmails = allDonations?.map(donation => ({
    ...donation,
    donors: donation.donors ? {
      ...(donation.donors as any),
      email: donorProfiles?.find(p => p.id === (donation.donors as any)?.id)?.email
    } : null
  })) as any[];

  // Categorize donations
  const pendingApproval = donationsWithEmails?.filter(d => d.approval_status === "pending") || [];
  const approved = donationsWithEmails?.filter(d => d.approval_status === "approved") || [];
  const rejected = donationsWithEmails?.filter(d => d.approval_status === "rejected") || [];
  const active = donationsWithEmails?.filter(d => d.status === "approved" || d.status === "allocated") || [];
  const completed = donationsWithEmails?.filter(d => d.status === "delivered") || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      approved: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
      allocated: { variant: "secondary", icon: Truck },
      delivered: { variant: "default", icon: CheckCircle },
      cancelled: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getApprovalBadge = (approvalStatus: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { variant: "outline" },
      approved: { variant: "default" },
      rejected: { variant: "destructive" },
    };

    const config = variants[approvalStatus] || variants.pending;

    return (
      <Badge variant={config.variant}>
        {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
      </Badge>
    );
  };

  const renderDonationCard = (donation: any) => (
    <Card key={donation.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {donation.title}
            </CardTitle>
            <CardDescription>{donation.description}</CardDescription>
            <div className="flex items-center gap-2 mt-2 justify-between">
              <span className="text-sm text-muted-foreground">
                By: {donation.donors?.organization_name || donation.donors?.full_name || "Unknown Donor"}
              </span>
              {donation.donors && (
                <DonorDetailsModal donor={donation.donors}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <User className="h-3 w-3" />
                    View Donor
                  </Button>
                </DonorDetailsModal>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {getApprovalBadge(donation.approval_status)}
            {getStatusBadge(donation.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium">{donation.donation_type}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Condition</p>
            <p className="font-medium">{donation.condition}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Quantity</p>
            <p className="font-medium">{donation.available_quantity} items</p>
          </div>
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{donation.city}, {donation.province}</p>
          </div>
        </div>

        {donation.items && donation.items.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Items:</p>
            <div className="flex flex-wrap gap-2">
              {donation.items.map((item: any, idx: number) => (
                <Badge key={idx} variant="secondary">
                  {item.quantity} {item.unit} - {item.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {donation.special_instructions && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Special Instructions:</p>
            <p className="text-sm text-muted-foreground mt-1">{donation.special_instructions}</p>
          </div>
        )}

        {donation.rejection_reason && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
            <p className="text-sm text-destructive/80 mt-1">{donation.rejection_reason}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Created: {new Date(donation.created_at).toLocaleDateString()}</span>
          {donation.delivery_available && (
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Delivery available ({donation.delivery_radius_km || 0}km radius)
            </span>
          )}
        </div>

        {donation.approval_status === "pending" && (
          <div className="mt-4 pt-4 border-t">
            <DonationApprovalActions donationId={donation.id} />
          </div>
        )}

        <DonationCardActions
          donationId={donation.id}
          donationTitle={donation.title}
          approvalStatus={donation.approval_status}
          status={donation.status}
        />
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout
      role="admin"
      userName={profile.email}
      userEmail={profile.email}
      pendingCount={pendingSchools || 0}
      pendingDonorsCount={pendingDonors || 0}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Donations Management</h2>
          <p className="text-muted-foreground mt-2">
            Review and manage all donation listings
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donationsWithEmails?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{pendingApproval.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approved.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{active.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completed.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different donation statuses */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending Approval
              {pendingApproval.length > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {pendingApproval.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingApproval.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No donations pending approval</p>
                </CardContent>
              </Card>
            ) : (
              pendingApproval.map(renderDonationCard)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approved.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No approved donations</p>
                </CardContent>
              </Card>
            ) : (
              approved.map(renderDonationCard)
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {active.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active donations</p>
                </CardContent>
              </Card>
            ) : (
              active.map(renderDonationCard)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completed.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed donations</p>
                </CardContent>
              </Card>
            ) : (
              completed.map(renderDonationCard)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejected.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No rejected donations</p>
                </CardContent>
              </Card>
            ) : (
              rejected.map(renderDonationCard)
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {!donationsWithEmails || donationsWithEmails.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No donations yet</p>
                </CardContent>
              </Card>
            ) : (
              donationsWithEmails.map(renderDonationCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
