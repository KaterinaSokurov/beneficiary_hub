"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { uploadSchoolDocuments } from "@/lib/supabase/storage";
import {
  schoolRegistrationSchema,
  type SchoolRegistrationFormData,
  type SchoolRegistrationFormInput,
  HARARE_DISTRICTS,
  SCHOOL_TYPES,
  CLASSROOM_CONDITIONS,
} from "@/lib/validations/school-registration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { MapPicker } from "@/components/map-picker";
import {
  School,
  MapPin,
  Users,
  Building2,
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";

const STEPS = [
  { id: 1, name: "Basic Information", icon: School },
  { id: 2, name: "Location & Contact", icon: MapPin },
  { id: 3, name: "Demographics", icon: Users },
  { id: 4, name: "Infrastructure", icon: Building2 },
  { id: 5, name: "Documents", icon: FileText },
];

const CACHE_KEY = "school_registration_form";
const CACHE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export function SchoolRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    registrationCertificate: number;
    headTeacherId: number;
    schoolPhoto: number;
    classroomPhoto: number;
    additionalDocument: number;
  }>({
    registrationCertificate: 0,
    headTeacherId: 0,
    schoolPhoto: 0,
    classroomPhoto: 0,
    additionalDocument: 0,
  });
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<SchoolRegistrationFormInput>({
    resolver: zodResolver(schoolRegistrationSchema),
    mode: "onBlur",
    defaultValues: {
      province: "Harare",
      hasElectricity: false,
      hasRunningWater: false,
      hasLibrary: false,
      hasComputerLab: false,
      hasFeedingProgram: false,
    },
  });

  const watchHasFeedingProgram = watch("hasFeedingProgram");

  // Debug: Log form errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Current form errors:", errors);
    }
  }, [errors]);

  // Load cached form data on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp, step } = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid (within 2 hours)
        if (now - timestamp < CACHE_TIMEOUT) {
          // Restore non-file fields and non-password fields only
          const {
            registrationCertificate,
            headTeacherId,
            schoolPhoto,
            classroomPhoto,
            additionalDocument,
            password,
            confirmPassword,
            ...restData
          } = data;

          // Set form values (skip undefined, null, and FileList objects)
          Object.entries(restData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              // Skip FileList and File objects
              if (!(value instanceof FileList) && !(value instanceof File)) {
                setValue(key as keyof SchoolRegistrationFormData, value as any);
              }
            }
          });

          // Restore step
          if (step) {
            setCurrentStep(step);
          }
        } else {
          // Cache expired, remove it
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load cached form data:", error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, [setValue]);

  // Save form data to cache whenever it changes
  useEffect(() => {
    const subscription = watch((data) => {
      try {
        // Don't cache file inputs
        const {
          registrationCertificate,
          headTeacherId,
          schoolPhoto,
          classroomPhoto,
          additionalDocument,
          ...dataToCache
        } = data;

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: dataToCache,
            timestamp: Date.now(),
            step: currentStep,
          })
        );
      } catch (error) {
        console.error("Failed to cache form data:", error);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, currentStep]);

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
  };

  const onSubmit = async (data: SchoolRegistrationFormData) => {
    console.log("Form submission started", data);
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("Current user:", user);

      if (!user) {
        throw new Error("You must be logged in to complete registration. Please sign up first.");
      }

      const userId = user.id;

      // Get user profile for head teacher information
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, phone_number, email")
        .eq("id", userId)
        .single();

      console.log("User profile:", profile, "Error:", profileError);

      if (profileError) throw profileError;
      if (!profile) throw new Error("Profile not found");

      // Type assertion for profile data
      const profileData = profile as unknown as { full_name: string | null; phone_number: string | null; email: string };

      // Step 1: Upload documents with progress tracking
      // Convert FileList to File objects
      const uploadResults = await uploadSchoolDocuments(
        userId,
        {
          registrationCertificate: data.registrationCertificate[0],
          headTeacherId: data.headTeacherId[0],
          schoolPhoto: data.schoolPhoto[0],
          classroomPhoto: data.classroomPhoto[0],
          additionalDocument: data.additionalDocument?.[0] || null,
        },
        {
          registrationCertificate: (progress) =>
            setUploadProgress((prev) => ({ ...prev, registrationCertificate: progress })),
          headTeacherId: (progress) =>
            setUploadProgress((prev) => ({ ...prev, headTeacherId: progress })),
          schoolPhoto: (progress) =>
            setUploadProgress((prev) => ({ ...prev, schoolPhoto: progress })),
          classroomPhoto: (progress) =>
            setUploadProgress((prev) => ({ ...prev, classroomPhoto: progress })),
          additionalDocument: (progress) =>
            setUploadProgress((prev) => ({ ...prev, additionalDocument: progress })),
        }
      );

      if (uploadResults.errors.length > 0) {
        throw new Error(
          `Document upload failed: ${uploadResults.errors.join(", ")}`
        );
      }

      // Step 2: Insert school record
      const { error: insertError } = await supabase.from("schools").insert({
        id: userId,
        school_name: data.schoolName,
        registration_number: data.registrationNumber,
        school_type: data.schoolType,
        province: data.province,
        district: data.district,
        ward: data.ward,
        physical_address: data.physicalAddress,
        gps_coordinates: data.gpsCoordinates,
        head_teacher_name: profileData.full_name || "",
        head_teacher_phone: profileData.phone_number || "",
        head_teacher_email: profileData.email || "",
        alternative_contact_name: data.alternativeContactName,
        alternative_contact_phone: data.alternativeContactPhone,
        total_students: data.totalStudents,
        male_students: data.maleStudents,
        female_students: data.femaleStudents,
        total_teachers: data.totalTeachers,
        grades_offered: data.gradesOffered,
        has_electricity: data.hasElectricity,
        has_running_water: data.hasRunningWater,
        has_library: data.hasLibrary,
        has_computer_lab: data.hasComputerLab,
        number_of_classrooms: data.numberOfClassrooms,
        classroom_condition: data.classroomCondition,
        has_feeding_program: data.hasFeedingProgram,
        feeding_program_details: data.feedingProgramDetails,
        students_requiring_meals: data.studentsRequiringMeals,
        school_fees_amount: data.schoolFeesAmount,
        percentage_fee_paying: data.percentageFeePaying,
        registration_certificate_url: uploadResults.registrationCertificateUrl,
        head_teacher_id_url: uploadResults.headTeacherIdUrl,
        school_photo_url: uploadResults.schoolPhotoUrl,
        classroom_photo_url: uploadResults.classroomPhotoUrl,
        additional_document_url: uploadResults.additionalDocumentUrl,
      });

      if (insertError) throw insertError;

      // Clear cache on successful submission
      clearCache();

      console.log("Registration completed successfully");
      setSuccess(true);
      setTimeout(() => {
        router.push("/school/pending");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof SchoolRegistrationFormInput)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["schoolName", "registrationNumber", "schoolType"];
        break;
      case 2:
        fieldsToValidate = [
          "district",
          "ward",
          "physicalAddress",
          "gpsCoordinates",
          "alternativeContactName",
          "alternativeContactPhone",
        ];
        break;
      case 3:
        fieldsToValidate = [
          "totalStudents",
          "maleStudents",
          "femaleStudents",
          "totalTeachers",
          "gradesOffered",
        ];
        break;
      case 4:
        fieldsToValidate = [
          "numberOfClassrooms",
          "classroomCondition",
          "feedingProgramDetails",
          "studentsRequiringMeals",
          "schoolFeesAmount",
          "percentageFeePaying",
        ];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="space-y-3 pb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">
                School Registration
              </CardTitle>
              <CardDescription className="text-base">
                Complete all sections to register your school. Your application will
                be reviewed by administrators.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to clear all form data? This cannot be undone.")) {
                  clearCache();
                  window.location.reload();
                }
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Form
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center ${
                      currentStep >= step.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        currentStep >= step.id
                          ? "border-primary bg-primary/10"
                          : "border-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs mt-1 hidden sm:block">
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your progress is automatically saved for 2 hours. You can safely close this page and return later.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Registration submitted successfully! Your account is pending admin approval.
                You will be able to login once an administrator reviews and approves your school registration.
                Redirecting to login...
              </AlertDescription>
            </Alert>
          )}

          {isSubmitting && (
            <div className="mb-6 border rounded-lg p-6 bg-muted/30">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading Documents...
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Registration Certificate</span>
                    <span className="text-muted-foreground">{uploadProgress.registrationCertificate}%</span>
                  </div>
                  <Progress value={uploadProgress.registrationCertificate} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Head Teacher ID</span>
                    <span className="text-muted-foreground">{uploadProgress.headTeacherId}%</span>
                  </div>
                  <Progress value={uploadProgress.headTeacherId} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>School Photo</span>
                    <span className="text-muted-foreground">{uploadProgress.schoolPhoto}%</span>
                  </div>
                  <Progress value={uploadProgress.schoolPhoto} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Classroom Photo</span>
                    <span className="text-muted-foreground">{uploadProgress.classroomPhoto}%</span>
                  </div>
                  <Progress value={uploadProgress.classroomPhoto} className="h-2" />
                </div>

                {watch("additionalDocument") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Additional Document</span>
                      <span className="text-muted-foreground">{uploadProgress.additionalDocument}%</span>
                    </div>
                    <Progress value={uploadProgress.additionalDocument} className="h-2" />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Please do not close this page while documents are uploading...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Form validation errors:", errors);
            setError("Please fix the validation errors before submitting");
          })} className="space-y-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold flex items-center gap-2 pb-2 border-b">
                  <School className="w-6 h-6 text-primary" />
                  Basic School Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="schoolName">
                    School Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="schoolName"
                    {...register("schoolName")}
                    placeholder="Enter full school name"
                  />
                  {errors.schoolName && (
                    <p className="text-sm text-destructive">
                      {errors.schoolName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">
                    Government Registration Number
                  </Label>
                  <Input
                    id="registrationNumber"
                    {...register("registrationNumber")}
                    placeholder="e.g., SCH/HAR/2024/001"
                  />
                  {errors.registrationNumber && (
                    <p className="text-sm text-destructive">
                      {errors.registrationNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolType">
                    School Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch("schoolType")}
                    onValueChange={(value) =>
                      setValue("schoolType", value as any, {
                        shouldValidate: true,
                      })
                    }
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
                  {errors.schoolType && (
                    <p className="text-sm text-destructive">
                      {errors.schoolType.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Location & Contact */}
            {currentStep === 2 && (
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
                      value={watch("district")}
                      onValueChange={(value) =>
                        setValue("district", value, { shouldValidate: true })
                      }
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
                    {errors.district && (
                      <p className="text-sm text-destructive">
                        {errors.district.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ward">Ward</Label>
                    <Input
                      id="ward"
                      {...register("ward")}
                      placeholder="e.g., Ward 15"
                    />
                    {errors.ward && (
                      <p className="text-sm text-destructive">
                        {errors.ward.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="physicalAddress">
                    Physical Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="physicalAddress"
                    {...register("physicalAddress")}
                    placeholder="Enter complete physical address"
                    rows={3}
                  />
                  {errors.physicalAddress && (
                    <p className="text-sm text-destructive">
                      {errors.physicalAddress.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  
                  <MapPicker
                    onLocationSelect={(lat, lng, address) => {
                      setValue("gpsCoordinates", `${lat}, ${lng}`, {
                        shouldValidate: true,
                      });
                      if (address) {
                        setValue("physicalAddress", address, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    initialLat={
                      watch("gpsCoordinates")
                        ? parseFloat(watch("gpsCoordinates")!.split(",")[0])
                        : undefined
                    }
                    initialLng={
                      watch("gpsCoordinates")
                        ? parseFloat(watch("gpsCoordinates")!.split(",")[1])
                        : undefined
                    }
                  />
                  {errors.gpsCoordinates && (
                    <p className="text-sm text-destructive">
                      {errors.gpsCoordinates.message}
                    </p>
                  )}
                </div>

                <div className="border-t pt-6 mt-8">
                  <h4 className="font-semibold text-lg mb-6">Alternative Contact (Optional)</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="alternativeContactName">Full Name</Label>
                      <Input
                        id="alternativeContactName"
                        {...register("alternativeContactName")}
                        placeholder="Alternative contact person"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alternativeContactPhone">Phone Number</Label>
                      <Input
                        id="alternativeContactPhone"
                        {...register("alternativeContactPhone")}
                        placeholder="+263771234567"
                      />
                      {errors.alternativeContactPhone && (
                        <p className="text-sm text-destructive">
                          {errors.alternativeContactPhone.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Demographics */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold flex items-center gap-2 pb-2 border-b">
                  <Users className="w-6 h-6 text-primary" />
                  School Demographics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="totalStudents">
                      Total Students <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="totalStudents"
                      type="number"
                      {...register("totalStudents", { valueAsNumber: true })}
                      placeholder="500"
                    />
                    {errors.totalStudents && (
                      <p className="text-sm text-destructive">
                        {errors.totalStudents.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maleStudents">Male Students (Optional)</Label>
                    <Input
                      id="maleStudents"
                      type="number"
                      {...register("maleStudents", { valueAsNumber: true })}
                      placeholder="250"
                    />
                    {errors.maleStudents && (
                      <p className="text-sm text-destructive">
                        {errors.maleStudents.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="femaleStudents">Female Students (Optional)</Label>
                    <Input
                      id="femaleStudents"
                      type="number"
                      {...register("femaleStudents", { valueAsNumber: true })}
                      placeholder="250"
                    />
                    {errors.femaleStudents && (
                      <p className="text-sm text-destructive">
                        {errors.femaleStudents.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="totalTeachers">
                      Total Teachers <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="totalTeachers"
                      type="number"
                      {...register("totalTeachers", { valueAsNumber: true })}
                      placeholder="15"
                    />
                    {errors.totalTeachers && (
                      <p className="text-sm text-destructive">
                        {errors.totalTeachers.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradesOffered">
                      Grades Offered <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="gradesOffered"
                      {...register("gradesOffered")}
                      placeholder="e.g., ECD-Grade 7 or Form 1-6"
                    />
                    {errors.gradesOffered && (
                      <p className="text-sm text-destructive">
                        {errors.gradesOffered.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Infrastructure */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold flex items-center gap-2 pb-2 border-b">
                  <Building2 className="w-6 h-6 text-primary" />
                  Infrastructure & Current State
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfClassrooms">
                      Number of Classrooms <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="numberOfClassrooms"
                      type="number"
                      {...register("numberOfClassrooms", { valueAsNumber: true })}
                      placeholder="12"
                    />
                    {errors.numberOfClassrooms && (
                      <p className="text-sm text-destructive">
                        {errors.numberOfClassrooms.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classroomCondition">
                      Classroom Condition <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={watch("classroomCondition")}
                      onValueChange={(value) =>
                        setValue("classroomCondition", value as any, {
                          shouldValidate: true,
                        })
                      }
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
                    {errors.classroomCondition && (
                      <p className="text-sm text-destructive">
                        {errors.classroomCondition.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 border p-4 rounded-md">
                  <h4 className="font-medium">Available Facilities</h4>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasElectricity"
                      onCheckedChange={(checked) =>
                        setValue("hasElectricity", checked as boolean)
                      }
                    />
                    <Label htmlFor="hasElectricity" className="font-normal cursor-pointer">
                      Electricity
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasRunningWater"
                      onCheckedChange={(checked) =>
                        setValue("hasRunningWater", checked as boolean)
                      }
                    />
                    <Label htmlFor="hasRunningWater" className="font-normal cursor-pointer">
                      Running Water
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasLibrary"
                      onCheckedChange={(checked) =>
                        setValue("hasLibrary", checked as boolean)
                      }
                    />
                    <Label htmlFor="hasLibrary" className="font-normal cursor-pointer">
                      Library
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasComputerLab"
                      onCheckedChange={(checked) =>
                        setValue("hasComputerLab", checked as boolean)
                      }
                    />
                    <Label htmlFor="hasComputerLab" className="font-normal cursor-pointer">
                      Computer Lab
                    </Label>
                  </div>
                </div>

                <div className="border-t pt-6 mt-8">
                  <h4 className="font-semibold text-lg mb-6">Food Security</h4>

                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="hasFeedingProgram"
                      onCheckedChange={(checked) =>
                        setValue("hasFeedingProgram", checked as boolean)
                      }
                    />
                    <Label htmlFor="hasFeedingProgram" className="font-normal cursor-pointer">
                      School has a feeding program
                    </Label>
                  </div>

                  {watchHasFeedingProgram && (
                    <div className="space-y-2">
                      <Label htmlFor="feedingProgramDetails">
                        Feeding Program Details <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="feedingProgramDetails"
                        {...register("feedingProgramDetails")}
                        placeholder="Describe the feeding program..."
                        rows={3}
                      />
                      {errors.feedingProgramDetails && (
                        <p className="text-sm text-destructive">
                          {errors.feedingProgramDetails.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="studentsRequiringMeals">
                      Students Requiring Daily Meals (Optional)
                    </Label>
                    <Input
                      id="studentsRequiringMeals"
                      type="number"
                      {...register("studentsRequiringMeals", { valueAsNumber: true })}
                      placeholder="Number of students needing meals"
                    />
                    {errors.studentsRequiringMeals && (
                      <p className="text-sm text-destructive">
                        {errors.studentsRequiringMeals.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6 mt-8">
                  <h4 className="font-semibold text-lg mb-6">Financial Information (Optional)</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="schoolFeesAmount">School Fees (USD)</Label>
                      <Input
                        id="schoolFeesAmount"
                        type="number"
                        step="0.01"
                        {...register("schoolFeesAmount", { valueAsNumber: true })}
                        placeholder="e.g., 50.00"
                      />
                      {errors.schoolFeesAmount && (
                        <p className="text-sm text-destructive">
                          {errors.schoolFeesAmount.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="percentageFeePaying">
                        Percentage of Fee-Paying Students (%)
                      </Label>
                      <Input
                        id="percentageFeePaying"
                        type="number"
                        {...register("percentageFeePaying", { valueAsNumber: true })}
                        placeholder="e.g., 60"
                      />
                      {errors.percentageFeePaying && (
                        <p className="text-sm text-destructive">
                          {errors.percentageFeePaying.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Documents */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold flex items-center gap-2 pb-2 border-b">
                  <Upload className="w-6 h-6 text-primary" />
                  Upload Required Documents
                </h3>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please upload clear scanned copies of your documents. Each file should not be larger than 5 MB.
                    These documents are required to verify your information and ensure trust in the system.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="registrationCertificate">
                    School Registration Certificate <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="registrationCertificate"
                    type="file"
                    accept="image/*,application/pdf"
                    {...register("registrationCertificate")}
                  />
                  {errors.registrationCertificate && (
                    <p className="text-sm text-destructive">
                      {errors.registrationCertificate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headTeacherId">
                    Head Teacher National ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="headTeacherId"
                    type="file"
                    accept="image/*,application/pdf"
                    {...register("headTeacherId")}
                  />
                  {errors.headTeacherId && (
                    <p className="text-sm text-destructive">
                      {errors.headTeacherId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolPhoto">
                    School Building Photo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="schoolPhoto"
                    type="file"
                    accept="image/*"
                    {...register("schoolPhoto")}
                  />
                  {errors.schoolPhoto && (
                    <p className="text-sm text-destructive">
                      {errors.schoolPhoto.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classroomPhoto">
                    Classroom Photo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="classroomPhoto"
                    type="file"
                    accept="image/*"
                    {...register("classroomPhoto")}
                  />
                  {errors.classroomPhoto && (
                    <p className="text-sm text-destructive">
                      {errors.classroomPhoto.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalDocument">
                    Additional Supporting Document (Optional)
                  </Label>
                  <Input
                    id="additionalDocument"
                    type="file"
                    accept="image/*,application/pdf"
                    {...register("additionalDocument")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Any other document that supports your application
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 mt-8 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
                size="lg"
                className="min-w-[120px]"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                  size="lg"
                  className="min-w-[120px]"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || success}
                  size="lg"
                  className="min-w-[180px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Registration"
                  )}
                </Button>
              )}
            </div>
          </form>

          <Separator className="my-6" />

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
