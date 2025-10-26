import { z } from "zod";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number validation (international format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Step 1: Personal Information
export const personalInfoSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),

  email: z.string()
    .min(1, "Email is required")
    .regex(emailRegex, "Please enter a valid email address")
    .toLowerCase(),

  phoneNumber: z.string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Please enter a valid phone number with country code (e.g., +1234567890)"),

  dateOfBirth: z.string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 120;
    }, "You must be at least 18 years old"),

  occupation: z.string().optional(),

  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),

  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Step 2: Address Information
export const addressInfoSchema = z.object({
  address: z.string()
    .min(5, "Street address must be at least 5 characters")
    .max(200, "Street address must not exceed 200 characters"),

  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters"),

  state: z.string()
    .max(100, "State/Province must not exceed 100 characters")
    .optional(),

  country: z.string()
    .min(2, "Country is required")
    .max(100, "Country must not exceed 100 characters"),

  postalCode: z.string()
    .max(20, "Postal code must not exceed 20 characters")
    .optional(),
});

// Step 3: Identification & Verification
export const identificationSchema = z.object({
  idType: z.enum(["national_id", "passport", "driver_license", "other"], {
    message: "Please select a valid ID type",
  }),

  idNumber: z.string()
    .min(3, "ID number must be at least 3 characters")
    .max(50, "ID number must not exceed 50 characters")
    .regex(/^[A-Z0-9-]+$/i, "ID number can only contain letters, numbers, and hyphens"),

  organizationName: z.string()
    .max(200, "Organization name must not exceed 200 characters")
    .optional(),

  idDocumentFile: z.custom<File>((file) => {
    if (!(file instanceof File)) return false;
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  }, "ID document must be a JPG, PNG, or PDF file (max 10MB)"),

  addressProofFile: z.custom<File>((file) => {
    if (!(file instanceof File)) return false;
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  }, "Address proof must be a JPG, PNG, or PDF file (max 10MB)"),
});

// Step 4: Financial/Tax Information (all optional)
export const financialInfoSchema = z.object({
  taxId: z.string()
    .max(50, "Tax ID must not exceed 50 characters")
    .optional(),

  companyRegNumber: z.string()
    .max(50, "Company registration number must not exceed 50 characters")
    .optional(),
});

// Step 5: Preferences & Background (all optional)
export const preferencesSchema = z.object({
  donationCategories: z.array(z.string()).optional(),

  donationFrequency: z.enum(["one-time", "monthly", "quarterly", "yearly"], {
    message: "Please select a valid donation frequency",
  }).optional(),

  preferredContactMethod: z.enum(["email", "phone", "sms"], {
    message: "Please select a valid contact method",
  }).optional(),

  newsletterConsent: z.boolean(),

  motivationForDonating: z.string()
    .max(1000, "Motivation must not exceed 1000 characters")
    .optional(),

  connectionToCause: z.string()
    .max(1000, "Connection to cause must not exceed 1000 characters")
    .optional(),

  previousCharitableWork: z.string()
    .max(1000, "Previous charitable work must not exceed 1000 characters")
    .optional(),
});

// Step 6: Emergency Contact & Legal
export const emergencyContactLegalSchema = z.object({
  emergencyContactName: z.string()
    .max(100, "Emergency contact name must not exceed 100 characters")
    .optional(),

  emergencyContactPhone: z.string()
    .regex(phoneRegex, "Please enter a valid phone number with country code")
    .optional()
    .or(z.literal("")),

  emergencyContactRelationship: z.string()
    .max(50, "Relationship must not exceed 50 characters")
    .optional(),

  termsAccepted: z.boolean()
    .refine((val) => val === true, {
      message: "You must accept the Terms and Conditions",
    }),

  privacyAccepted: z.boolean()
    .refine((val) => val === true, {
      message: "You must accept the Privacy Policy",
    }),

  amlAcknowledged: z.boolean()
    .refine((val) => val === true, {
      message: "You must acknowledge AML compliance",
    }),
});

// Complete form schema (for final submission)
export const completeDonorRegistrationSchema = z.object({
  // Step 1
  ...personalInfoSchema.shape,
  // Step 2
  ...addressInfoSchema.shape,
  // Step 3
  ...identificationSchema.shape,
  // Step 4
  ...financialInfoSchema.shape,
  // Step 5
  ...preferencesSchema.shape,
  // Step 6
  ...emergencyContactLegalSchema.shape,
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type AddressInfoFormData = z.infer<typeof addressInfoSchema>;
export type IdentificationFormData = z.infer<typeof identificationSchema>;
export type FinancialInfoFormData = z.infer<typeof financialInfoSchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
export type EmergencyContactLegalFormData = z.infer<typeof emergencyContactLegalSchema>;
export type CompleteDonorRegistrationFormData = z.infer<typeof completeDonorRegistrationSchema>;
