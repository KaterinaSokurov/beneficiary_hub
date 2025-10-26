import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";

export default async function DonationsListPage() {
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
    redirect("/");
  }

  const { data: donorData } = await supabase
    .from("donors")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!donorData || !donorData.is_verified) {
    redirect("/donor/pending");
  }

  // Fetch all donations for this donor
  const { data: donations } = await supabase
    .from("donations")
    .select("*")
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false });

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

  return (
    <DashboardLayout
      role="donor"
      userName={donorData.full_name || profile.email}
      userEmail={profile.email}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Donations</h2>
            <p className="text-muted-foreground mt-2">
              View and manage your donation listings
            </p>
          </div>
          <Link href="/donor/donations/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Donation
            </Button>
          </Link>
        </div>

        {(!donations || donations.length === 0) ? (
          <Card>
            <CardHeader>
              <CardTitle>No Donations Yet</CardTitle>
              <CardDescription>
                You haven't created any donations yet. Start by listing resources you'd like to donate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/donor/donations/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Donation
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {donations.map((donation) => (
              <Card key={donation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        {donation.title}
                      </CardTitle>
                      <CardDescription>{donation.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(donation.status)}
                      {donation.approval_status === "pending" && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending Approval
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

                  {donation.items && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {(donation.items as any[]).map((item: any, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {item.quantity} {item.unit} - {item.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {donation.rejection_reason && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                      <p className="text-sm text-destructive/80 mt-1">{donation.rejection_reason}</p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created: {new Date(donation.created_at).toLocaleDateString()}</span>
                    {donation.delivery_available && (
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Delivery available ({donation.delivery_radius_km || 0}km radius)
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
