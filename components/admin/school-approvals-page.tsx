"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { approveSchool, rejectSchool } from "@/app/actions/school-approvals";
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
import { SchoolDetailsDialog } from "./school-details-dialog";
import { SchoolListView } from "@/types/school";
import {
  School,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  MapPin,
  Users,
} from "lucide-react";

export function SchoolApprovalsPage() {
  const [schools, setSchools] = useState<SchoolListView[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolListView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSchool, setSelectedSchool] = useState<SchoolListView | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    filterSchools();
  }, [schools, searchQuery, statusFilter]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("schools")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setSchools(data || []);
    } catch (err) {
      console.error("Error fetching schools:", err);
      setError(err instanceof Error ? err.message : "Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  const filterSchools = () => {
    let filtered = schools;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((school) => school.approval_status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (school) =>
          school.school_name.toLowerCase().includes(query) ||
          school.head_teacher_name.toLowerCase().includes(query) ||
          school.district.toLowerCase().includes(query) ||
          (school.head_teacher_email && school.head_teacher_email.toLowerCase().includes(query))
      );
    }

    setFilteredSchools(filtered);
  };

  const handleApprove = async (schoolId: string) => {
    try {
      const result = await approveSchool(schoolId);

      if (!result.success) {
        setError(result.error || "Failed to approve school");
        return;
      }

      // Refresh schools list
      await fetchSchools();
      setIsDialogOpen(false);
      setError(null);
    } catch (err) {
      console.error("Error approving school:", err);
      setError(err instanceof Error ? err.message : "Failed to approve school");
    }
  };

  const handleReject = async (schoolId: string) => {
    try {
      const result = await rejectSchool(schoolId);

      if (!result.success) {
        setError(result.error || "Failed to reject school");
        return;
      }

      // Refresh schools list
      await fetchSchools();
      setIsDialogOpen(false);
      setError(null);
    } catch (err) {
      console.error("Error rejecting school:", err);
      setError(err instanceof Error ? err.message : "Failed to reject school");
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const pendingCount = schools.filter((s) => s.approval_status === "pending").length;
  const approvedCount = schools.filter((s) => s.approval_status === "approved").length;
  const rejectedCount = schools.filter((s) => s.approval_status === "rejected").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <School className="h-8 w-8 text-primary" />
            School Approvals
          </h1>
          <p className="text-muted-foreground mt-2">
            Review and approve school registrations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Schools</CardDescription>
              <CardTitle className="text-3xl">{schools.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Pending Review
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Approved
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">{approvedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                Rejected
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">{rejectedCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by school name, head teacher, district, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved ({approvedCount})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({rejectedCount})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              All ({schools.length})
            </TabsTrigger>
          </TabsList>

          {["pending", "approved", "rejected", "all"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {filteredSchools
                .filter((school) => tab === "all" || school.approval_status === tab)
                .map((school) => (
                  <Card key={school.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-semibold">{school.school_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {school.school_type} School
                              </p>
                            </div>
                            {getStatusBadge(school.approval_status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>Head Teacher: {school.head_teacher_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{school.district} District</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{school.total_students} Students</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              Registered:{" "}
                              {school.created_at ? new Date(school.created_at).toLocaleDateString() : "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:items-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedSchool(school);
                              setIsDialogOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>

                          {school.approval_status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(school.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(school.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {filteredSchools.filter((school) => tab === "all" || school.approval_status === tab)
                .length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No schools found matching your criteria
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

      {/* Details Dialog */}
      {selectedSchool && (
        <SchoolDetailsDialog
          school={selectedSchool}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
