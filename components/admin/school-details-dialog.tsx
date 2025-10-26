"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { SchoolListView, SchoolDetailView } from "@/types/school";
import {
  CheckCircle2,
  XCircle,
  School,
  MapPin,
  Users,
  Building2,
  FileText,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

interface SchoolDetailsDialogProps {
  school: SchoolListView;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (schoolId: string) => void;
  onReject: (schoolId: string) => void;
}

export function SchoolDetailsDialog({
  school,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: SchoolDetailsDialogProps) {
  const [fullSchoolData, setFullSchoolData] = useState<SchoolDetailView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && school) {
      fetchFullSchoolData();
    }
  }, [isOpen, school]);

  const fetchFullSchoolData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", school.id)
        .single();

      if (error) throw error;
      setFullSchoolData(data);
    } catch (err) {
      console.error("Error fetching school details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (filePath: string | null) => {
    if (!filePath) return;
    const url = getPublicUrl("school-documents", filePath);
    window.open(url, "_blank");
  };

  if (loading || !fullSchoolData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle></DialogTitle>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
         <DialogTitle className="text-2xl flex items-center gap-2">
                <School className="h-6 w-6 text-primary" />
                {fullSchoolData.school_name}
              </DialogTitle>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
             
              <DialogDescription>
                {fullSchoolData.school_type} School • {fullSchoolData.district} District
              </DialogDescription>
            </div>
            <Badge
              variant={
                fullSchoolData.approval_status === "approved"
                  ? "default"
                  : fullSchoolData.approval_status === "rejected"
                  ? "destructive"
                  : "outline"
              }
            >
              {fullSchoolData.approval_status}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">School Name</label>
                  <p className="text-sm mt-1">{fullSchoolData.school_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                  <p className="text-sm mt-1">{fullSchoolData.registration_number || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">School Type</label>
                  <p className="text-sm mt-1">{fullSchoolData.school_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">District</label>
                  <p className="text-sm mt-1">{fullSchoolData.district}</p>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Physical Address
                </label>
                <p className="text-sm mt-1">{fullSchoolData.physical_address}</p>
                {fullSchoolData.gps_coordinates && (
                  <p className="text-xs text-muted-foreground mt-1">
                    GPS: {fullSchoolData.gps_coordinates}
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Head Teacher Contact
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm mt-1">{fullSchoolData.head_teacher_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </label>
                    <p className="text-sm mt-1">{fullSchoolData.head_teacher_phone}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </label>
                    <p className="text-sm mt-1">{fullSchoolData.head_teacher_email}</p>
                  </div>
                </div>
              </div>

              {fullSchoolData.alternative_contact_name && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold">Alternative Contact</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="text-sm mt-1">{fullSchoolData.alternative_contact_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-sm mt-1">{fullSchoolData.alternative_contact_phone || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Registered: {fullSchoolData.created_at ? new Date(fullSchoolData.created_at).toLocaleString() : "N/A"}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Students</label>
                <p className="text-2xl font-bold mt-1">{fullSchoolData.total_students}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Male Students</label>
                <p className="text-2xl font-bold mt-1">{fullSchoolData.male_students || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Female Students</label>
                <p className="text-2xl font-bold mt-1">{fullSchoolData.female_students || "N/A"}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Teachers</label>
                <p className="text-lg font-semibold mt-1">{fullSchoolData.total_teachers}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Grades Offered</label>
                <p className="text-sm mt-1">{fullSchoolData.grades_offered}</p>
              </div>
            </div>

            {fullSchoolData.has_feeding_program && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Feeding Program</label>
                  <p className="text-sm mt-1">{fullSchoolData.feeding_program_details}</p>
                  {fullSchoolData.students_requiring_meals && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Students requiring meals: {fullSchoolData.students_requiring_meals}
                    </p>
                  )}
                </div>
              </>
            )}

            {fullSchoolData.school_fees_amount !== null && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">School Fees (USD)</label>
                    <p className="text-sm mt-1">${fullSchoolData.school_fees_amount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fee-Paying Students</label>
                    <p className="text-sm mt-1">{fullSchoolData.percentage_fee_paying}%</p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Number of Classrooms</label>
                <p className="text-lg font-semibold mt-1">{fullSchoolData.number_of_classrooms}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Classroom Condition</label>
                <p className="text-sm mt-1">{fullSchoolData.classroom_condition}</p>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-3 block">Available Facilities</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Electricity", value: fullSchoolData.has_electricity },
                  { label: "Running Water", value: fullSchoolData.has_running_water },
                  { label: "Library", value: fullSchoolData.has_library },
                  { label: "Computer Lab", value: fullSchoolData.has_computer_lab },
                ].map((facility) => (
                  <div
                    key={facility.label}
                    className={`p-2 rounded-md border ${
                      facility.value
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      {facility.value ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {facility.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Registration Certificate", url: fullSchoolData.registration_certificate_url },
                { label: "Head Teacher ID", url: fullSchoolData.head_teacher_id_url },
                { label: "School Photo", url: fullSchoolData.school_photo_url },
                { label: "Classroom Photo", url: fullSchoolData.classroom_photo_url },
                { label: "Additional Document", url: fullSchoolData.additional_document_url },
              ].map((doc) => (
                <div
                  key={doc.label}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{doc.label}</span>
                  </div>
                  {doc.url ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocument(doc.url)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not provided</span>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          {fullSchoolData.approval_status === "pending" && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => onReject(fullSchoolData.id)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => onApprove(fullSchoolData.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve School
              </Button>
            </>
          )}
          {fullSchoolData.approval_status !== "pending" && (
            <Button onClick={onClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
