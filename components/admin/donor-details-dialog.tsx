"use client";

import { useState } from "react";
import { getPublicUrl } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database } from "@/types/database.types";
import {
  CheckCircle2,
  XCircle,
  Heart,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  FileText,
  User,
  Building2,
  Loader2,
  AlertCircle,
} from "lucide-react";

type Donor = Database["public"]["Tables"]["donors"]["Row"];
type DonorWithProfile = Donor & { email: string };

interface DonorDetailsDialogProps {
  donor: DonorWithProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (donorId: string) => void;
  onReject: (donorId: string, reason: string) => void;
}

export function DonorDetailsDialog({
  donor,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: DonorDetailsDialogProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove(donor.id);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    setIsProcessing(true);
    await onReject(donor.id, rejectionReason);
    setIsProcessing(false);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const handleViewDocument = (filePath: string | null) => {
    if (!filePath) return;
    const url = getPublicUrl("donor-documents", filePath);
    window.open(filePath, "_blank");
  };

  const getStatusBadge = () => {
    switch (donor.verification_status) {
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-primary" />
            Donor Details
          </DialogTitle>
          <DialogDescription>
            Review donor information and verification documents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{donor.full_name || "Unknown"}</h3>
              <p className="text-sm text-muted-foreground">{donor.email}</p>
            </div>
            {getStatusBadge()}
          </div>

          <Separator />

          {/* Tabs for Different Sections */}
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{donor.full_name || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date of Birth</Label>
                  <p className="font-medium">
                    {donor.date_of_birth ? new Date(donor.date_of_birth).toLocaleDateString() : "Not provided"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {donor.email}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {donor.phone_number || "Not provided"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Occupation</Label>
                  <p className="font-medium">{donor.occupation || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organization</Label>
                  <p className="font-medium flex items-center gap-2">
                    {donor.organization_name && <Building2 className="h-4 w-4 text-muted-foreground" />}
                    {donor.organization_name || "Individual Donor"}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Address Information */}
            <TabsContent value="address" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Street Address</Label>
                  <p className="font-medium">{donor.address || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">City</Label>
                  <p className="font-medium">{donor.city || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">State/Province</Label>
                  <p className="font-medium">{donor.state || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Country</Label>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {donor.country || "Not provided"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Postal Code</Label>
                  <p className="font-medium">{donor.postal_code || "Not provided"}</p>
                </div>
              </div>
            </TabsContent>

            {/* Verification Documents */}
            <TabsContent value="verification" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">ID Type</Label>
                  <p className="font-medium capitalize">{donor.id_type?.replace(/_/g, " ") || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ID Number</Label>
                  <p className="font-medium">{donor.id_number || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tax ID</Label>
                  <p className="font-medium">{donor.tax_id || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Company Registration</Label>
                  <p className="font-medium">{donor.company_registration_number || "Not provided"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Uploaded Documents</h4>
                <div className="grid gap-2">
                  {donor.id_document_url && (
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => handleViewDocument(donor.id_document_url)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View ID Document
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  {donor.address_proof_url && (
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => handleViewDocument(donor.address_proof_url)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Address Proof
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  {!donor.id_document_url && !donor.address_proof_url && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>No documents uploaded</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold">Legal Acknowledgments</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {donor.terms_accepted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span>Terms and Conditions</span>
                    {donor.terms_accepted_at && (
                      <span className="text-xs text-muted-foreground">
                        ({new Date(donor.terms_accepted_at).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {donor.privacy_policy_accepted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span>Privacy Policy</span>
                    {donor.privacy_policy_accepted_at && (
                      <span className="text-xs text-muted-foreground">
                        ({new Date(donor.privacy_policy_accepted_at).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {donor.aml_acknowledgment ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span>AML Compliance Acknowledgment</span>
                    {donor.aml_acknowledged_at && (
                      <span className="text-xs text-muted-foreground">
                        ({new Date(donor.aml_acknowledged_at).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Preferences */}
            <TabsContent value="preferences" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Preferred Donation Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {donor.preferred_donation_categories && donor.preferred_donation_categories.length > 0 ? (
                      donor.preferred_donation_categories.map((category) => (
                        <Badge key={category} variant="secondary" className="capitalize">
                          {category}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Donation Frequency</Label>
                  <p className="font-medium capitalize">
                    {donor.donation_frequency_preference?.replace(/-/g, " ") || "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Preferred Contact Method</Label>
                  <p className="font-medium capitalize">{donor.preferred_contact_method || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Newsletter Consent</Label>
                  <p className="font-medium">{donor.newsletter_consent ? "Yes" : "No"}</p>
                </div>
              </div>
            </TabsContent>

            {/* Background & Emergency Contact */}
            <TabsContent value="background" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Motivation for Donating</Label>
                  <p className="mt-2 text-sm">{donor.motivation_for_donating || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Connection to the Cause</Label>
                  <p className="mt-2 text-sm">{donor.connection_to_cause || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Previous Charitable Work</Label>
                  <p className="mt-2 text-sm">{donor.previous_charitable_work || "Not provided"}</p>
                </div>

                <Separator />

                <h4 className="font-semibold">Emergency Contact</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{donor.emergency_contact_name || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{donor.emergency_contact_phone || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Relationship</Label>
                    <p className="font-medium">{donor.emergency_contact_relationship || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Registration Information */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Registered:</span>
              <span className="font-medium">{new Date(donor.created_at).toLocaleDateString()}</span>
            </div>
            {donor.verified_at && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Verified:</span>
                <span className="font-medium">{new Date(donor.verified_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-4 p-4 border border-destructive rounded-lg">
              <Label htmlFor="rejectionReason">Reason for Rejection *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejecting this donor application..."
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {donor.verification_status === "pending" && !showRejectForm && (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setShowRejectForm(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve Donor
              </Button>
            </div>
          )}

          {showRejectForm && (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => {
                setShowRejectForm(false);
                setRejectionReason("");
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirm Rejection
              </Button>
            </div>
          )}

          {donor.verification_status !== "pending" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
