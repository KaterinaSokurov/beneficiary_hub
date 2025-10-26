"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, Shield, UserCircle, MapPin, FileText, DollarSign, MessageSquare, Upload } from "lucide-react";
import { registerDonor } from "@/app/actions/donor-registration";
import { createClient } from "@/lib/supabase/client";
import {
  personalInfoSchema,
  addressInfoSchema,
  identificationSchema,
  financialInfoSchema,
  preferencesSchema,
  emergencyContactLegalSchema,
  completeDonorRegistrationSchema,
  type CompleteDonorRegistrationFormData,
} from "@/lib/validations/donor-registration";

const TOTAL_STEPS = 6;
const CACHE_KEY = "donor_registration_form_cache";
const CACHE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export function DonorRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<CompleteDonorRegistrationFormData>({
    resolver: zodResolver(completeDonorRegistrationSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      occupation: "",
      password: "",
      confirmPassword: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      idType: undefined,
      idNumber: "",
      organizationName: "",
      taxId: "",
      companyRegNumber: "",
      donationCategories: [],
      donationFrequency: undefined,
      preferredContactMethod: undefined,
      newsletterConsent: false,
      motivationForDonating: "",
      connectionToCause: "",
      previousCharitableWork: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      termsAccepted: false,
      privacyAccepted: false,
      amlAcknowledged: false,
    },
  });

  // Watch form values
  const watchedValues = watch();
  const donationCategories = watchedValues.donationCategories || [];

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
            idDocumentFile,
            addressProofFile,
            password,
            confirmPassword,
            ...restData
          } = data;

          // Set form values (skip undefined, null, and FileList objects)
          Object.entries(restData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              // Skip FileList and File objects
              if (!(value instanceof FileList) && !(value instanceof File)) {
                setValue(key as keyof CompleteDonorRegistrationFormData, value as any);
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
      console.error("Failed to load cached donor form data:", error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, [setValue]);

  // Save form data to cache whenever it changes
  useEffect(() => {
    const subscription = watch((data) => {
      try {
        // Don't cache file inputs or passwords
        const {
          idDocumentFile,
          addressProofFile,
          password,
          confirmPassword,
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
        console.error("Failed to cache donor form data:", error);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, currentStep]);

  const toggleCategory = (category: string) => {
    const currentCategories = donationCategories;
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    setValue("donationCategories", newCategories);
  };

  const uploadFile = async (file: File, folder: string, userId: string): Promise<string | null> => {
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('donor-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('donor-documents')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('File upload error:', err);
      return null;
    }
  };

  const handleSubmit = async (data: CompleteDonorRegistrationFormData) => {
    // Prevent submission if not on final step
    if (currentStep !== TOTAL_STEPS) {
      console.log("Form submission prevented - not on final step");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First create the user account
      const result = await registerDonor({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        phone_number: data.phoneNumber,
        date_of_birth: data.dateOfBirth,
        occupation: data.occupation || null,
        address: data.address,
        city: data.city,
        state: data.state || null,
        country: data.country,
        postal_code: data.postalCode || null,
        id_type: data.idType,
        id_number: data.idNumber,
        organization_name: data.organizationName || null,
        tax_id: data.taxId || null,
        company_registration_number: data.companyRegNumber || null,
        preferred_donation_categories: data.donationCategories && data.donationCategories.length > 0 ? data.donationCategories : null,
        donation_frequency_preference: data.donationFrequency || null,
        preferred_contact_method: data.preferredContactMethod || null,
        newsletter_consent: data.newsletterConsent,
        motivation_for_donating: data.motivationForDonating || null,
        connection_to_cause: data.connectionToCause || null,
        previous_charitable_work: data.previousCharitableWork || null,
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_phone: data.emergencyContactPhone || null,
        emergency_contact_relationship: data.emergencyContactRelationship || null,
        terms_accepted: data.termsAccepted,
        privacy_policy_accepted: data.privacyAccepted,
        aml_acknowledgment: data.amlAcknowledged,
      });

      if (!result.success) {
        setError(result.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Upload files after successful registration
      if (result.userId && (data.idDocumentFile || data.addressProofFile)) {
        setUploadingFiles(true);

        const supabase = createClient();
        const updateData: { id_document_url?: string; address_proof_url?: string } = {};

        if (data.idDocumentFile) {
          const idDocUrl = await uploadFile(data.idDocumentFile, 'id-documents', result.userId);
          if (idDocUrl) {
            updateData.id_document_url = idDocUrl;
          }
        }

        if (data.addressProofFile) {
          const addressProofUrl = await uploadFile(data.addressProofFile, 'address-proofs', result.userId);
          if (addressProofUrl) {
            updateData.address_proof_url = addressProofUrl;
          }
        }

        // Update the donors table with document URLs
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('donors')
            .update(updateData)
            .eq('id', result.userId);

          if (updateError) {
            console.error('Error updating donor documents:', updateError);
          }
        }
      }

      // Clear the cached form data on successful registration
      localStorage.removeItem(CACHE_KEY);

      router.push("/donor/pending");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during registration");
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof CompleteDonorRegistrationFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ["fullName", "email", "phoneNumber", "dateOfBirth", "password", "confirmPassword"];
        break;
      case 2:
        fieldsToValidate = ["address", "city", "country"];
        break;
      case 3:
        fieldsToValidate = ["idType", "idNumber", "idDocumentFile", "addressProofFile"];
        break;
      case 4:
        // Financial info is optional, but validate if present
        fieldsToValidate = ["taxId", "companyRegNumber"];
        break;
      case 5:
        // Preferences are optional, but validate if present
        fieldsToValidate = ["motivationForDonating", "connectionToCause", "previousCharitableWork"];
        break;
      case 6:
        fieldsToValidate = ["termsAccepted", "privacyAccepted", "amlAcknowledged"];
        break;
    }

    const isValid = await trigger(fieldsToValidate);

    if (!isValid) {
      // Get the first error message from the fields we validated
      const firstError = fieldsToValidate.find(field => errors[field]);
      if (firstError && errors[firstError]) {
        setError(errors[firstError]?.message || "Please fix the validation errors");
      }
    }

    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      return;
    }
    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const getStepTitle = (step: number) => {
    const titles = {
      1: "Personal Info",
      2: "Address",
      3: "Verification",
      4: "Financial",
      5: "Preferences",
      6: "Legal",
    };
    return titles[step as keyof typeof titles];
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Donor Registration - Step {currentStep} of {TOTAL_STEPS}
        </CardTitle>
        <CardDescription>
          {getStepTitle(currentStep)} - We collect comprehensive information to ensure trust and transparency
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center min-w-fit">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep >= step ? 'bg-primary text-white' : 'bg-muted'}`}>
                  {step}
                </div>
                <span className="text-xs mt-1 text-muted-foreground">{getStepTitle(step)}</span>
              </div>
              {index < 5 && <div className={`h-1 w-8 ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />}
            </React.Fragment>
          ))}
        </div>

        <form
          onSubmit={handleFormSubmit(handleSubmit)}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting the form unless on final step
            if (e.key === 'Enter' && currentStep !== TOTAL_STEPS) {
              e.preventDefault();
            }
          }}
          className="space-y-6"
        >
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <UserCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                  <Input id="fullName" {...register("fullName")} placeholder="John Doe" />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive">*</span></Label>
                  <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                  {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number <span className="text-destructive">*</span></Label>
                  <Input id="phoneNumber" type="tel" {...register("phoneNumber")} placeholder="+1234567890" />
                  {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input id="occupation" {...register("occupation")} placeholder="e.g., Software Engineer" />
                {errors.occupation && <p className="text-sm text-destructive">{errors.occupation.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                  <Input id="password" type="password" {...register("password")} placeholder="Min. 8 characters" />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                  <Input id="confirmPassword" type="password" {...register("confirmPassword")} placeholder="Re-enter password" />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Address Information</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address <span className="text-destructive">*</span></Label>
                <Input id="address" {...register("address")} placeholder="123 Main Street" />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                  <Input id="city" {...register("city")} placeholder="New York" />
                  {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input id="state" {...register("state")} placeholder="NY" />
                  {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                  <Input id="country" {...register("country")} placeholder="United States" />
                  {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" {...register("postalCode")} placeholder="10001" />
                  {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Identification & Document Upload */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Identification & Verification Documents</h3>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  Upload clear copies of your ID and proof of address for verification. Accepted formats: JPG, PNG, PDF (max 10MB)
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type <span className="text-destructive">*</span></Label>
                  <Select value={watchedValues.idType} onValueChange={(value) => setValue("idType", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driver_license">Driver's License</SelectItem>
                      <SelectItem value="other">Other Government ID</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.idType && <p className="text-sm text-destructive">{errors.idType.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number <span className="text-destructive">*</span></Label>
                  <Input id="idNumber" {...register("idNumber")} placeholder="Enter ID number" />
                  {errors.idNumber && <p className="text-sm text-destructive">{errors.idNumber.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idDocument">Upload ID Document <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="idDocument"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setValue("idDocumentFile", file);
                    }}
                  />
                  {watchedValues.idDocumentFile && <Upload className="h-4 w-4 text-green-600" />}
                </div>
                {errors.idDocumentFile && <p className="text-sm text-destructive">{errors.idDocumentFile.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressProof">Upload Proof of Address <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="addressProof"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setValue("addressProofFile", file);
                    }}
                  />
                  {watchedValues.addressProofFile && <Upload className="h-4 w-4 text-green-600" />}
                </div>
                {errors.addressProofFile && <p className="text-sm text-destructive">{errors.addressProofFile.message}</p>}
                <p className="text-xs text-muted-foreground">Utility bill, bank statement, or government document with your address</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name (Optional)</Label>
                <Input id="organizationName" {...register("organizationName")} placeholder="If donating on behalf of an organization" />
                {errors.organizationName && <p className="text-sm text-destructive">{errors.organizationName.message}</p>}
              </div>
            </div>
          )}

          {/* Step 4: Financial/Tax Information */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Financial & Tax Information (Optional)</h3>
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  This information helps us provide tax-deductible receipts and verify organizational donations
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / SSN (Optional)</Label>
                <Input id="taxId" {...register("taxId")} placeholder="For tax-deductible receipts" />
                {errors.taxId && <p className="text-sm text-destructive">{errors.taxId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyRegNumber">Company Registration Number (Optional)</Label>
                <Input id="companyRegNumber" {...register("companyRegNumber")} placeholder="If donating as an organization" />
                {errors.companyRegNumber && <p className="text-sm text-destructive">{errors.companyRegNumber.message}</p>}
              </div>
            </div>
          )}

          {/* Step 5: Preferences & Background */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Donation Preferences & Background</h3>
              </div>

              <div className="space-y-2">
                <Label>Preferred Donation Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Education', 'Healthcare', 'Infrastructure', 'Technology', 'Nutrition', 'Other'].map(cat => (
                    <div key={cat} className="flex items-center gap-2">
                      <Checkbox
                        id={cat}
                        checked={donationCategories.includes(cat.toLowerCase())}
                        onCheckedChange={() => toggleCategory(cat.toLowerCase())}
                      />
                      <Label htmlFor={cat} className="font-normal cursor-pointer">{cat}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="donationFrequency">Preferred Donation Frequency</Label>
                <Select value={watchedValues.donationFrequency} onValueChange={(value) => setValue("donationFrequency", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                {errors.donationFrequency && <p className="text-sm text-destructive">{errors.donationFrequency.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                <Select value={watchedValues.preferredContactMethod} onValueChange={(value) => setValue("preferredContactMethod", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
                {errors.preferredContactMethod && <p className="text-sm text-destructive">{errors.preferredContactMethod.message}</p>}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="newsletter"
                  checked={watchedValues.newsletterConsent}
                  onCheckedChange={(checked) => setValue("newsletterConsent", checked as boolean)}
                />
                <Label htmlFor="newsletter" className="font-normal cursor-pointer">I consent to receiving newsletters and updates</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivation">Motivation for Donating</Label>
                <Textarea id="motivation" {...register("motivationForDonating")} placeholder="What inspires you to give?" rows={3} />
                {errors.motivationForDonating && <p className="text-sm text-destructive">{errors.motivationForDonating.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="connection">Connection to the Cause</Label>
                <Textarea id="connection" {...register("connectionToCause")} placeholder="Personal or professional connection" rows={3} />
                {errors.connectionToCause && <p className="text-sm text-destructive">{errors.connectionToCause.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousWork">Previous Charitable Work</Label>
                <Textarea id="previousWork" {...register("previousCharitableWork")} placeholder="Any prior volunteer or donation experience" rows={3} />
                {errors.previousCharitableWork && <p className="text-sm text-destructive">{errors.previousCharitableWork.message}</p>}
              </div>
            </div>
          )}

          {/* Step 6: Emergency Contact & Legal */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Emergency Contact & Legal Acknowledgments</h3>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Emergency Contact (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Contact Name</Label>
                    <Input id="emergencyName" {...register("emergencyContactName")} placeholder="Full name" />
                    {errors.emergencyContactName && <p className="text-sm text-destructive">{errors.emergencyContactName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Contact Phone</Label>
                    <Input id="emergencyPhone" type="tel" {...register("emergencyContactPhone")} placeholder="+1234567890" />
                    {errors.emergencyContactPhone && <p className="text-sm text-destructive">{errors.emergencyContactPhone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyRelationship">Relationship</Label>
                    <Input id="emergencyRelationship" {...register("emergencyContactRelationship")} placeholder="e.g., Spouse" />
                    {errors.emergencyContactRelationship && <p className="text-sm text-destructive">{errors.emergencyContactRelationship.message}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm">Legal Acknowledgments <span className="text-destructive">*</span></h4>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={watchedValues.termsAccepted}
                    onCheckedChange={(checked) => setValue("termsAccepted", checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="terms" className="font-normal cursor-pointer text-sm">
                      I have read and agree to the <Link href="/terms" className="text-primary underline" target="_blank">Terms and Conditions</Link>
                    </Label>
                    {errors.termsAccepted && <p className="text-sm text-destructive">{errors.termsAccepted.message}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="privacy"
                    checked={watchedValues.privacyAccepted}
                    onCheckedChange={(checked) => setValue("privacyAccepted", checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="privacy" className="font-normal cursor-pointer text-sm">
                      I have read and agree to the <Link href="/privacy" className="text-primary underline" target="_blank">Privacy Policy</Link>
                    </Label>
                    {errors.privacyAccepted && <p className="text-sm text-destructive">{errors.privacyAccepted.message}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="aml"
                    checked={watchedValues.amlAcknowledged}
                    onCheckedChange={(checked) => setValue("amlAcknowledged", checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="aml" className="font-normal cursor-pointer text-sm">
                      I acknowledge and comply with Anti-Money Laundering (AML) regulations and confirm that all donations will be from legitimate sources
                    </Label>
                    {errors.amlAcknowledged && <p className="text-sm text-destructive">{errors.amlAcknowledged.message}</p>}
                  </div>
                </div>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Your information is encrypted and securely stored. Account verification typically takes 24-48 hours.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} disabled={loading || uploadingFiles}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {currentStep < TOTAL_STEPS ? (
                <Button type="button" onClick={nextStep} disabled={loading || uploadingFiles}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading || uploadingFiles}>
                  {(loading || uploadingFiles) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {uploadingFiles ? "Uploading documents..." : loading ? "Creating account..." : "Complete Registration"}
                </Button>
              )}
            </div>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
