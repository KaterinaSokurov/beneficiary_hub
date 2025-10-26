"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSchoolInformation, updateHeadTeacherProfile, updateSchoolDocuments } from "@/app/actions/school-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School, User, AlertCircle, CheckCircle2, Loader2, Building2, Users as UsersIcon, FileText, Link as LinkIcon, MapPin } from "lucide-react";
import { SchoolDetailView } from "@/types/school";
import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
import { MapPicker } from "@/components/map-picker";
import { HARARE_DISTRICTS, SCHOOL_TYPES, CLASSROOM_CONDITIONS } from "@/lib/validations/school-registration";
import { getPublicUrl } from "@/lib/supabase/storage";

interface SchoolSettingsPageProps {
  school: SchoolDetailView;
  profile: Profile;
}

export function SchoolSettingsPage({ school, profile }: SchoolSettingsPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // School Information State
  const [schoolData, setSchoolData] = useState({
    school_name: school.school_name,
    school_type: school.school_type,
    registration_number: school.registration_number || "",
    district: school.district,
    province: school.province || "Harare",
    ward: school.ward || "",
    physical_address: school.physical_address,
    gps_coordinates: school.gps_coordinates || "",
    total_students: school.total_students,
    male_students: school.male_students || 0,
    female_students: school.female_students || 0,
    total_teachers: school.total_teachers,
    grades_offered: school.grades_offered || "",
    alternative_contact_name: school.alternative_contact_name || "",
    alternative_contact_phone: school.alternative_contact_phone || "",
    has_electricity: school.has_electricity || false,
    has_running_water: school.has_running_water || false,
    has_library: school.has_library || false,
    has_computer_lab: school.has_computer_lab || false,
    number_of_classrooms: school.number_of_classrooms || 0,
    classroom_condition: school.classroom_condition || "",
    has_feeding_program: school.has_feeding_program || false,
    feeding_program_details: school.feeding_program_details || "",
    students_requiring_meals: school.students_requiring_meals || 0,
    school_fees_amount: school.school_fees_amount || 0,
    percentage_fee_paying: school.percentage_fee_paying || 0,
  });

  // Head Teacher Profile State
  const [headTeacherData, setHeadTeacherData] = useState({
    full_name: profile.full_name || "",
    head_teacher_name: school.head_teacher_name,
    head_teacher_email: school.head_teacher_email || "",
    head_teacher_phone: school.head_teacher_phone || "",
  });

  const handleSchoolUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateSchoolInformation(school.id, schoolData);

      if (!result.success) {
        setError(result.error || "Failed to update school information");
        return;
      }

      setSuccess("School information updated successfully!");
      setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } catch (err) {
      console.error("Error updating school:", err);
      setError(err instanceof Error ? err.message : "Failed to update school information");
    } finally {
      setLoading(false);
    }
  };

  const handleHeadTeacherUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateHeadTeacherProfile(school.id, headTeacherData);

      if (!result.success) {
        setError(result.error || "Failed to update head teacher profile");
        return;
      }

      setSuccess("Head teacher profile updated successfully!");
      setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } catch (err) {
      console.error("Error updating head teacher:", err);
      setError(err instanceof Error ? err.message : "Failed to update head teacher profile");
    } finally {
      setLoading(false);
    }
  };

   const handleViewDocument = (filePath: string | null) => {
      if (!filePath) return;
      if (typeof window === "undefined") return; // Prevent SSR error
      const url = getPublicUrl("school-documents", filePath);
      window.open(url, "_blank");
    };

  const handleDocumentsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const result = await updateSchoolDocuments(school.id, formData);

      if (!result.success) {
        setError(result.error || "Failed to update documents");
        return;
      }

      setSuccess("Documents updated successfully!");
      setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } catch (err) {
      console.error("Error updating documents:", err);
      setError(err instanceof Error ? err.message : "Failed to update documents");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">School Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your school information, facilities, and documents
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="infrastructure" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Infrastructure
          </TabsTrigger>
          <TabsTrigger value="headteacher" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Head Teacher
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Basic Information & Demographics Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>School Information & Demographics</CardTitle>
              <CardDescription>
                Update your school details, location, contact, and student information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSchoolUpdate} className="space-y-8">
                {/* Basic School Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2 pb-2 border-b">
                    <School className="w-6 h-6 text-primary" />
                    Basic School Information
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="school_name">
                      School Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="school_name"
                      value={schoolData.school_name}
                      onChange={(e) => setSchoolData({ ...schoolData, school_name: e.target.value })}
                      placeholder="Enter full school name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration_number">
                      Government Registration Number
                    </Label>
                    <Input
                      id="registration_number"
                      value={schoolData.registration_number}
                      onChange={(e) => setSchoolData({ ...schoolData, registration_number: e.target.value })}
                      placeholder="e.g., SCH/HAR/2024/001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school_type">
                      School Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={schoolData.school_type}
                      onValueChange={(value) => setSchoolData({ ...schoolData, school_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location & Contact */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2 pb-2 border-b">
                    <MapPin className="w-6 h-6 text-primary" />
                    Location & Contact Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="district">
                        District <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={schoolData.district}
                        onValueChange={(value) => setSchoolData({ ...schoolData, district: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                          {HARARE_DISTRICTS.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ward">Ward</Label>
                      <Input
                        id="ward"
                        value={schoolData.ward}
                        onChange={(e) => setSchoolData({ ...schoolData, ward: e.target.value })}
                        placeholder="e.g., Ward 15"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physical_address">
                      Physical Address <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="physical_address"
                      value={schoolData.physical_address}
                      onChange={(e) => setSchoolData({ ...schoolData, physical_address: e.target.value })}
                      placeholder="Enter complete physical address"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <MapPicker
                      onLocationSelect={(lat, lng, address) => {
                        setSchoolData({
                          ...schoolData,
                          gps_coordinates: `${lat}, ${lng}`,
                          physical_address: address || schoolData.physical_address
                        });
                      }}
                      initialLat={
                        schoolData.gps_coordinates
                          ? parseFloat(schoolData.gps_coordinates.split(",")[0])
                          : undefined
                      }
                      initialLng={
                        schoolData.gps_coordinates
                          ? parseFloat(schoolData.gps_coordinates.split(",")[1])
                          : undefined
                      }
                    />
                  </div>

                  <div className="border-t pt-6 mt-8">
                    <h4 className="font-semibold text-lg mb-6">Alternative Contact (Optional)</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="alternative_contact_name">Full Name</Label>
                        <Input
                          id="alternative_contact_name"
                          value={schoolData.alternative_contact_name}
                          onChange={(e) => setSchoolData({ ...schoolData, alternative_contact_name: e.target.value })}
                          placeholder="Alternative contact person"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alternative_contact_phone">Phone Number</Label>
                        <Input
                          id="alternative_contact_phone"
                          value={schoolData.alternative_contact_phone}
                          onChange={(e) => setSchoolData({ ...schoolData, alternative_contact_phone: e.target.value })}
                          placeholder="+263771234567"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2 pb-2 border-b">
                    <UsersIcon className="w-6 h-6 text-primary" />
                    School Demographics
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="total_students">
                        Total Students <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="total_students"
                        type="number"
                        value={schoolData.total_students}
                        onChange={(e) => setSchoolData({ ...schoolData, total_students: parseInt(e.target.value) || 0 })}
                        placeholder="500"
                        required
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="male_students">Male Students (Optional)</Label>
                      <Input
                        id="male_students"
                        type="number"
                        value={schoolData.male_students}
                        onChange={(e) => setSchoolData({ ...schoolData, male_students: parseInt(e.target.value) || 0 })}
                        placeholder="250"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="female_students">Female Students (Optional)</Label>
                      <Input
                        id="female_students"
                        type="number"
                        value={schoolData.female_students}
                        onChange={(e) => setSchoolData({ ...schoolData, female_students: parseInt(e.target.value) || 0 })}
                        placeholder="250"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="total_teachers">
                        Total Teachers <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="total_teachers"
                        type="number"
                        value={schoolData.total_teachers}
                        onChange={(e) => setSchoolData({ ...schoolData, total_teachers: parseInt(e.target.value) || 0 })}
                        placeholder="15"
                        required
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grades_offered">
                        Grades Offered <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="grades_offered"
                        value={schoolData.grades_offered}
                        onChange={(e) => setSchoolData({ ...schoolData, grades_offered: e.target.value })}
                        placeholder="e.g., ECD-Grade 7 or Form 1-6"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Information
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure & Current State</CardTitle>
              <CardDescription>
                Update information about facilities, feeding programs, and financial details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSchoolUpdate} className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2 pb-2 border-b">
                    <Building2 className="w-6 h-6 text-primary" />
                    Infrastructure & Current State
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="number_of_classrooms">
                        Number of Classrooms <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="number_of_classrooms"
                        type="number"
                        value={schoolData.number_of_classrooms}
                        onChange={(e) => setSchoolData({ ...schoolData, number_of_classrooms: parseInt(e.target.value) || 0 })}
                        placeholder="12"
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="classroom_condition">
                        Classroom Condition <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={schoolData.classroom_condition}
                        onValueChange={(value) => setSchoolData({ ...schoolData, classroom_condition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSROOM_CONDITIONS.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3 border p-4 rounded-md">
                    <h4 className="font-medium">Available Facilities</h4>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_electricity"
                        checked={schoolData.has_electricity}
                        onCheckedChange={(checked) => setSchoolData({ ...schoolData, has_electricity: checked as boolean })}
                      />
                      <Label htmlFor="has_electricity" className="font-normal cursor-pointer">
                        Electricity
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_running_water"
                        checked={schoolData.has_running_water}
                        onCheckedChange={(checked) => setSchoolData({ ...schoolData, has_running_water: checked as boolean })}
                      />
                      <Label htmlFor="has_running_water" className="font-normal cursor-pointer">
                        Running Water
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_library"
                        checked={schoolData.has_library}
                        onCheckedChange={(checked) => setSchoolData({ ...schoolData, has_library: checked as boolean })}
                      />
                      <Label htmlFor="has_library" className="font-normal cursor-pointer">
                        Library
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_computer_lab"
                        checked={schoolData.has_computer_lab}
                        onCheckedChange={(checked) => setSchoolData({ ...schoolData, has_computer_lab: checked as boolean })}
                      />
                      <Label htmlFor="has_computer_lab" className="font-normal cursor-pointer">
                        Computer Lab
                      </Label>
                    </div>
                  </div>

                  <div className="border-t pt-6 mt-8">
                    <h4 className="font-semibold text-lg mb-6">Food Security</h4>

                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="has_feeding_program"
                        checked={schoolData.has_feeding_program}
                        onCheckedChange={(checked) => setSchoolData({ ...schoolData, has_feeding_program: checked as boolean })}
                      />
                      <Label htmlFor="has_feeding_program" className="font-normal cursor-pointer">
                        School has a feeding program
                      </Label>
                    </div>

                    {schoolData.has_feeding_program && (
                      <div className="space-y-2">
                        <Label htmlFor="feeding_program_details">
                          Feeding Program Details <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="feeding_program_details"
                          value={schoolData.feeding_program_details}
                          onChange={(e) => setSchoolData({ ...schoolData, feeding_program_details: e.target.value })}
                          placeholder="Describe the feeding program..."
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="students_requiring_meals">
                        Students Requiring Daily Meals (Optional)
                      </Label>
                      <Input
                        id="students_requiring_meals"
                        type="number"
                        value={schoolData.students_requiring_meals}
                        onChange={(e) => setSchoolData({ ...schoolData, students_requiring_meals: parseInt(e.target.value) || 0 })}
                        placeholder="Number of students needing meals"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6 mt-8">
                    <h4 className="font-semibold text-lg mb-6">Financial Information (Optional)</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="school_fees_amount">School Fees (USD)</Label>
                        <Input
                          id="school_fees_amount"
                          type="number"
                          step="0.01"
                          value={schoolData.school_fees_amount}
                          onChange={(e) => setSchoolData({ ...schoolData, school_fees_amount: parseFloat(e.target.value) || 0 })}
                          placeholder="e.g., 50.00"
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="percentage_fee_paying">
                          Percentage of Fee-Paying Students (%)
                        </Label>
                        <Input
                          id="percentage_fee_paying"
                          type="number"
                          value={schoolData.percentage_fee_paying}
                          onChange={(e) => setSchoolData({ ...schoolData, percentage_fee_paying: parseInt(e.target.value) || 0 })}
                          placeholder="e.g., 60"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Infrastructure Details
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Head Teacher Tab */}
        <TabsContent value="headteacher">
          <Card>
            <CardHeader>
              <CardTitle>Head Teacher Profile</CardTitle>
              <CardDescription>
                Update head teacher personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleHeadTeacherUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      Full Name (Profile) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      value={headTeacherData.full_name}
                      onChange={(e) => setHeadTeacherData({ ...headTeacherData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="head_teacher_name">
                      Head Teacher Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="head_teacher_name"
                      value={headTeacherData.head_teacher_name}
                      onChange={(e) => setHeadTeacherData({ ...headTeacherData, head_teacher_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="head_teacher_email">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="head_teacher_email"
                      type="email"
                      value={headTeacherData.head_teacher_email}
                      onChange={(e) => setHeadTeacherData({ ...headTeacherData, head_teacher_email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="head_teacher_phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="head_teacher_phone"
                      type="tel"
                      value={headTeacherData.head_teacher_phone}
                      onChange={(e) => setHeadTeacherData({ ...headTeacherData, head_teacher_phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Head Teacher Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>School Documents</CardTitle>
              <CardDescription>
                Upload or update required school documents (PDF, JPG, PNG - Max 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDocumentsUpdate} className="space-y-6">
                <div className="space-y-6">
                  {/* Registration Certificate */}
                  <div className="space-y-2">
                    <Label htmlFor="registration_certificate">
                      School Registration Certificate
                    </Label>
                    {school.registration_certificate_url && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <LinkIcon className="h-4 w-4" />
                        <span  onClick={()=>handleViewDocument(school.registration_certificate_url)} className="hover:underline cursor-pointer">
                          View Current Document
                        </span>
                      </div>
                    )}
                    <Input
                      id="registration_certificate"
                      name="registration_certificate"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>

                  {/* Head Teacher ID */}
                  <div className="space-y-2">
                    <Label htmlFor="head_teacher_id">
                      Head Teacher ID Document
                    </Label>
                    {school.head_teacher_id_url && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <LinkIcon className="h-4 w-4" />
                        
                          <span  onClick={()=>handleViewDocument(school.head_teacher_id_url)} className="hover:underline cursor-pointer">
                          View Current Document
                        </span>
                      </div>
                    )}
                    <Input
                      id="head_teacher_id"
                      name="head_teacher_id"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>

                  {/* School Photo */}
                  <div className="space-y-2">
                    <Label htmlFor="school_photo">
                      School Building Photo
                    </Label>
                    {school.school_photo_url && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <LinkIcon className="h-4 w-4" />
                       
                          <span  onClick={()=>handleViewDocument(school.school_photo_url)} className="hover:underline cursor-pointer">
                          View Current Document
                        </span>
                      </div>
                    )}
                    <Input
                      id="school_photo"
                      name="school_photo"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                    />
                  </div>

                  {/* Classroom Photo */}
                  <div className="space-y-2">
                    <Label htmlFor="classroom_photo">
                      Classroom Photo
                    </Label>
                    {school.classroom_photo_url && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <LinkIcon className="h-4 w-4" />
                       
                          <span  onClick={()=>handleViewDocument(school.classroom_photo_url)} className="hover:underline cursor-pointer">
                          View Current Document
                        </span>
                      </div>
                    )}
                    <Input
                      id="classroom_photo"
                      name="classroom_photo"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                    />
                  </div>

                  {/* Additional Document */}
                  <div className="space-y-2">
                    <Label htmlFor="additional_document">
                      Additional Document (Optional)
                    </Label>
                    {school.additional_document_url && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <LinkIcon className="h-4 w-4" />
                      
                          <span  onClick={()=>handleViewDocument(school.additional_document_url)} className="hover:underline cursor-pointer">
                          View Current Document
                        </span>
                      </div>
                    )}
                    <Input
                      id="additional_document"
                      name="additional_document"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload Documents
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
