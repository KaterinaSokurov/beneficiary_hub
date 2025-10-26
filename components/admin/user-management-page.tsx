"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Mail,
  Calendar,
} from "lucide-react";
import { enrollUser, toggleUserStatus } from "@/app/actions/user-management";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  organization_name: string | null;
  role: "admin" | "approver" | "donor" | "school";
  is_active: boolean | null;
  created_at: string;
}

interface UserManagementPageProps {
  users: User[];
}

export function UserManagementPage({ users: initialUsers }: UserManagementPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Enrollment form state
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollFullName, setEnrollFullName] = useState("");
  const [enrollPhoneNumber, setEnrollPhoneNumber] = useState("");
  const [enrollOrganizationName, setEnrollOrganizationName] = useState("");
  const [enrollRole, setEnrollRole] = useState<"admin" | "approver">("approver");
  const [enrollPassword, setEnrollPassword] = useState("");

  // Filter users based on current filters
  const filteredUsers = (() => {
    let filtered = initialUsers;

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((user) => user.is_active === isActive);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.full_name?.toLowerCase().includes(query) ||
          user.organization_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  })();

  const handleEnrollUser = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!enrollEmail || !enrollPassword) {
        setError("Email and password are required");
        setLoading(false);
        return;
      }

      if (enrollPassword.length < 8) {
        setError("Password must be at least 8 characters");
        setLoading(false);
        return;
      }

      const result = await enrollUser({
        email: enrollEmail,
        password: enrollPassword,
        full_name: enrollFullName || null,
        phone_number: enrollPhoneNumber || null,
        organization_name: enrollOrganizationName || null,
        role: enrollRole,
      });

      if (!result.success) {
        setError(result.error || "Failed to enroll user");
        return;
      }

      setSuccess(`Successfully enrolled ${enrollEmail} as ${enrollRole}`);
      setEnrollDialogOpen(false);
      setEnrollEmail("");
      setEnrollFullName("");
      setEnrollPhoneNumber("");
      setEnrollOrganizationName("");
      setEnrollPassword("");
      setEnrollRole("approver");

      // Refresh the page immediately
      router.refresh();
    } catch (err) {
      console.error("Error enrolling user:", err);
      setError(err instanceof Error ? err.message : "Failed to enroll user");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean | null) => {
    try {
      const newStatus = !currentStatus;
      const result = await toggleUserStatus(userId, newStatus);

      if (!result.success) {
        setError(result.error || "Failed to update user status");
        return;
      }

      setSuccess(`User status updated successfully`);
      router.refresh();
    } catch (err) {
      console.error("Error toggling user status:", err);
      setError(err instanceof Error ? err.message : "Failed to update user status");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case "approver":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approver
          </Badge>
        );
      case "donor":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            Donor
          </Badge>
        );
      case "school":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
            School
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean | null) => {
    return isActive ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const adminCount = initialUsers.filter((u) => u.role === "admin").length;
  const approverCount = initialUsers.filter((u) => u.role === "approver").length;
  const donorCount = initialUsers.filter((u) => u.role === "donor").length;
  const schoolCount = initialUsers.filter((u) => u.role === "school").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage platform users and enroll new admins and approvers
          </p>
        </div>
        <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Enroll User
            </Button>
          </DialogTrigger>
          <DialogContent className=" w-[80%] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enroll New User</DialogTitle>
              <DialogDescription>
                Create a new admin or approver account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="enroll_email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="enroll_email"
                  type="email"
                  value={enrollEmail}
                  onChange={(e) => setEnrollEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enroll_password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="enroll_password"
                  type="password"
                  value={enrollPassword}
                  onChange={(e) => setEnrollPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enroll_full_name">Full Name</Label>
                <Input
                  id="enroll_full_name"
                  value={enrollFullName}
                  onChange={(e) => setEnrollFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enroll_phone_number">Phone Number</Label>
                <Input
                  id="enroll_phone_number"
                  type="tel"
                  value={enrollPhoneNumber}
                  onChange={(e) => setEnrollPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enroll_organization_name">Organization Name</Label>
                <Input
                  id="enroll_organization_name"
                  value={enrollOrganizationName}
                  onChange={(e) => setEnrollOrganizationName(e.target.value)}
                  placeholder="Organization or Department"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enroll_role">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={enrollRole}
                  onValueChange={(value) => setEnrollRole(value as "admin" | "approver")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approver">Approver</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEnrollUser} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enroll User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Admins
            </CardDescription>
            <CardTitle className="text-3xl text-purple-600">{adminCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Approvers
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">{approverCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Donors</CardDescription>
            <CardTitle className="text-3xl text-green-600">{donorCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Schools</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{schoolCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-[500px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select 
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="w-[200px] sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="approver">Approver</SelectItem>
                <SelectItem value="donor">Donor</SelectItem>
                <SelectItem value="school">School</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[200px] sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {user.full_name || user.organization_name || "No name"}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.created_at).toISOString().split('T')[0]}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role !== "school" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
