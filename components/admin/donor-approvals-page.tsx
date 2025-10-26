"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { approveDonor, rejectDonor } from "@/app/actions/donor-approvals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonorDetailsDialog } from "./donor-details-dialog";
import { Database } from "@/types/database.types";
import {
  Heart,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  MapPin,
  User,
  Calendar,
} from "lucide-react";

type Donor = Database["public"]["Tables"]["donors"]["Row"];
type DonorWithProfile = Donor & { email: string };

export function DonorApprovalsPage() {
  const [donors, setDonors] = useState<DonorWithProfile[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<DonorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDonor, setSelectedDonor] = useState<DonorWithProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchDonors();
  }, []);

  useEffect(() => {
    filterDonors();
  }, [donors, searchQuery, statusFilter]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch donors with their email from profiles
      const { data: donorsData, error: fetchError } = await supabase
        .from("donors")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch profiles to get emails
      const donorIds = donorsData?.map(d => d.id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", donorIds);

      // Merge donors with their emails
      const donorsWithEmails = donorsData?.map(donor => {
        const profile = profilesData?.find(p => p.id === donor.id);
        return {
          ...donor,
          email: profile?.email || "",
        };
      }) || [];

      setDonors(donorsWithEmails);
    } catch (err) {
      console.error("Error fetching donors:", err);
      setError(err instanceof Error ? err.message : "Failed to load donors");
    } finally {
      setLoading(false);
    }
  };

  const filterDonors = () => {
    let filtered = donors;

    // Filter by verification status
    if (statusFilter !== "all") {
      filtered = filtered.filter((donor) => donor.verification_status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (donor) =>
          donor.email.toLowerCase().includes(query) ||
          (donor.full_name && donor.full_name.toLowerCase().includes(query)) ||
          (donor.organization_name && donor.organization_name.toLowerCase().includes(query)) ||
          (donor.phone_number && donor.phone_number.toLowerCase().includes(query))
      );
    }

    setFilteredDonors(filtered);
  };

  const handleApprove = async (donorId: string) => {
    try {
      const result = await approveDonor(donorId);
      if (result.success) {
        await fetchDonors();
        setIsDialogOpen(false);
      } else {
        setError(result.error || "Failed to approve donor");
      }
    } catch (err) {
      console.error("Error approving donor:", err);
      setError("Failed to approve donor");
    }
  };

  const handleReject = async (donorId: string, reason: string) => {
    try {
      const result = await rejectDonor(donorId, reason);
      if (result.success) {
        await fetchDonors();
        setIsDialogOpen(false);
      } else {
        setError(result.error || "Failed to reject donor");
      }
    } catch (err) {
      console.error("Error rejecting donor:", err);
      setError("Failed to reject donor");
    }
  };

  const handleViewDetails = (donor: DonorWithProfile) => {
    setSelectedDonor(donor);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  const pendingCount = donors.filter((d) => d.verification_status === "pending").length;
  const approvedCount = donors.filter((d) => d.verification_status === "approved").length;
  const rejectedCount = donors.filter((d) => d.verification_status === "rejected").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-primary" />
          Donor Approvals
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and verify donor registrations
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              Verified donors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">
              Failed verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, organization, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Donors Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({donors.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {filteredDonors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <Heart className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No donors found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredDonors.map((donor) => (
                <Card key={donor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {donor.full_name || "Unknown"}
                            </h3>
                            <p className="text-sm text-muted-foreground">{donor.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {donor.organization_name && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Organization:</span>
                              <span className="text-muted-foreground">{donor.organization_name}</span>
                            </div>
                          )}
                          {donor.phone_number && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Phone:</span>
                              <span className="text-muted-foreground">{donor.phone_number}</span>
                            </div>
                          )}
                          {donor.city && donor.country && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {donor.city}, {donor.country}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Registered: {donor.created_at ? new Date(donor.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        {getStatusBadge(donor.verification_status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(donor)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {filteredDonors.filter((d) => d.verification_status === "pending").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <Clock className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No pending donors</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredDonors
                .filter((d) => d.verification_status === "pending")
                .map((donor) => (
                  <Card key={donor.id} className="hover:shadow-lg transition-shadow border-amber-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {donor.full_name || "Unknown"}
                              </h3>
                              <p className="text-sm text-muted-foreground">{donor.email}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {donor.organization_name && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Organization:</span>
                                <span className="text-muted-foreground">{donor.organization_name}</span>
                              </div>
                            )}
                            {donor.phone_number && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Phone:</span>
                                <span className="text-muted-foreground">{donor.phone_number}</span>
                              </div>
                            )}
                            {donor.city && donor.country && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {donor.city}, {donor.country}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          {getStatusBadge(donor.verification_status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(donor)}
                          >
                            Review Application
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {filteredDonors.filter((d) => d.verification_status === "approved").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No approved donors</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredDonors
                .filter((d) => d.verification_status === "approved")
                .map((donor) => (
                  <Card key={donor.id} className="hover:shadow-lg transition-shadow border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {donor.full_name || "Unknown"}
                              </h3>
                              <p className="text-sm text-muted-foreground">{donor.email}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {donor.organization_name && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{donor.organization_name}</span>
                              </div>
                            )}
                            {donor.verified_at && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Verified: {new Date(donor.verified_at).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          {getStatusBadge(donor.verification_status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(donor)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {filteredDonors.filter((d) => d.verification_status === "rejected").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <XCircle className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No rejected donors</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredDonors
                .filter((d) => d.verification_status === "rejected")
                .map((donor) => (
                  <Card key={donor.id} className="hover:shadow-lg transition-shadow border-red-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-full">
                              <User className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {donor.full_name || "Unknown"}
                              </h3>
                              <p className="text-sm text-muted-foreground">{donor.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          {getStatusBadge(donor.verification_status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(donor)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Donor Details Dialog */}
      {selectedDonor && (
        <DonorDetailsDialog
          donor={selectedDonor}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
