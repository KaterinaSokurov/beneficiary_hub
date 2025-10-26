"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Building2, Calendar, Shield, FileText } from "lucide-react";

interface DonorDetailsModalProps {
  donor: {
    id: string;
    full_name: string;
    email?: string;
    phone_number?: string | null;
    organization_name?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;
    occupation?: string | null;
    date_of_birth?: string | null;
    id_type?: string | null;
    id_number?: string | null;
    tax_id?: string | null;
    company_registration_number?: string | null;
    verification_status?: string | null;
    is_verified?: boolean | null;
    verified_at?: string | null;
    created_at?: string | null;
    preferred_donation_categories?: string[] | null;
    donation_frequency_preference?: string | null;
    motivation_for_donating?: string | null;
    connection_to_cause?: string | null;
    previous_charitable_work?: string | null;
  };
  children?: React.ReactNode;
}

export function DonorDetailsModal({ donor, children }: DonorDetailsModalProps) {
  const getVerificationBadge = (status?: string | null, isVerified?: boolean | null) => {
    if (isVerified) {
      return <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" />Verified</Badge>;
    }

    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
    };

    return <Badge variant={variants[status || "pending"] || "outline"}>{status || "Pending"}</Badge>;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || <Button variant="outline" size="sm">View Donor Details</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Donor Information
          </DialogTitle>
          <DialogDescription>
            Complete details about the donor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              {getVerificationBadge(donor.verification_status, donor.is_verified)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Full Name
                </p>
                <p className="font-medium">{donor.full_name}</p>
              </div>

              {donor.email && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <p className="font-medium">{donor.email}</p>
                </div>
              )}

              {donor.phone_number && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone Number
                  </p>
                  <p className="font-medium">{donor.phone_number}</p>
                </div>
              )}

              {donor.date_of_birth && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date of Birth
                  </p>
                  <p className="font-medium">{new Date(donor.date_of_birth).toLocaleDateString()}</p>
                </div>
              )}

              {donor.occupation && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Occupation</p>
                  <p className="font-medium">{donor.occupation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Organization Information */}
          {donor.organization_name && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Organization Name</p>
                  <p className="font-medium">{donor.organization_name}</p>
                </div>

                {donor.company_registration_number && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Registration Number</p>
                    <p className="font-medium">{donor.company_registration_number}</p>
                  </div>
                )}

                {donor.tax_id && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tax ID</p>
                    <p className="font-medium">{donor.tax_id}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address Information */}
          {(donor.address || donor.city || donor.state || donor.country) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </h3>

              <div className="space-y-2">
                {donor.address && <p>{donor.address}</p>}
                <p className="text-sm">
                  {[donor.city, donor.state, donor.postal_code, donor.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Identification */}
          {(donor.id_type || donor.id_number) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Identification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {donor.id_type && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID Type</p>
                    <p className="font-medium">{donor.id_type}</p>
                  </div>
                )}

                {donor.id_number && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID Number</p>
                    <p className="font-medium">{donor.id_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Donation Preferences */}
          {(donor.preferred_donation_categories || donor.donation_frequency_preference) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Donation Preferences</h3>

              <div className="space-y-4">
                {donor.preferred_donation_categories && donor.preferred_donation_categories.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Preferred Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {donor.preferred_donation_categories.map((category, idx) => (
                        <Badge key={idx} variant="secondary">{category}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {donor.donation_frequency_preference && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Donation Frequency</p>
                    <p className="font-medium">{donor.donation_frequency_preference}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Motivation & Background */}
          {(donor.motivation_for_donating || donor.connection_to_cause || donor.previous_charitable_work) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Background</h3>

              <div className="space-y-4">
                {donor.motivation_for_donating && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Motivation for Donating</p>
                    <p className="text-sm text-muted-foreground">{donor.motivation_for_donating}</p>
                  </div>
                )}

                {donor.connection_to_cause && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Connection to Cause</p>
                    <p className="text-sm text-muted-foreground">{donor.connection_to_cause}</p>
                  </div>
                )}

                {donor.previous_charitable_work && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Previous Charitable Work</p>
                    <p className="text-sm text-muted-foreground">{donor.previous_charitable_work}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Information */}
          {(donor.verified_at || donor.created_at) && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground">System Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {donor.created_at && (
                  <div>
                    <p className="text-muted-foreground">Registered</p>
                    <p>{new Date(donor.created_at).toLocaleString()}</p>
                  </div>
                )}

                {donor.verified_at && (
                  <div>
                    <p className="text-muted-foreground">Verified</p>
                    <p>{new Date(donor.verified_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
