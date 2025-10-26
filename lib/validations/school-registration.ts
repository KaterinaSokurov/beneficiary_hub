import { z } from "zod";

// File validation schema (validates FileList from file inputs)
const fileSchema = z
  .custom<FileList>((val) => val instanceof FileList, "File is required")
  .refine((files) => files.length > 0, "File is required")
  .refine((files) => files[0]?.size <= 5 * 1024 * 1024, {
    message: "File size must be less than 5MB",
  })
  .refine(
    (files) =>
      files[0] &&
      ["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(
        files[0].type
      ),
    {
      message: "File must be JPEG, PNG, or PDF",
    }
  );

// Optional file schema
const optionalFileSchema = z
  .custom<FileList>((val) => !val || val instanceof FileList, "Invalid file")
  .refine(
    (files) => !files || files.length === 0 || files[0]?.size <= 5 * 1024 * 1024,
    {
      message: "File size must be less than 5MB",
    }
  )
  .refine(
    (files) =>
      !files ||
      files.length === 0 ||
      (files[0] &&
        ["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(
          files[0].type
        )),
    {
      message: "File must be JPEG, PNG, or PDF",
    }
  )
  .optional()
  .nullable();

// Zimbabwe phone number validation (supports various formats)
const phoneRegex = /^(\+263|0)(7[1-9]|86|77)\d{7}$/;

export const schoolRegistrationSchema = z
  .object({
    // Basic School Information
    schoolName: z
      .string()
      .min(3, "School name must be at least 3 characters")
      .max(200, "School name must be less than 200 characters"),

    registrationNumber: z
      .string()
      .min(3, "Registration number is required")
      .max(50, "Registration number must be less than 50 characters")
      .optional(),

    schoolType: z.enum(["Primary", "Secondary", "Combined"], {
      message: "Please select a school type",
    }),

    // Location Details
    province: z.string().optional(),

    district: z
      .string()
      .min(2, "District is required")
      .max(100, "District name is too long"),

    ward: z.string().max(50, "Ward name is too long").optional(),

    physicalAddress: z
      .string()
      .min(10, "Physical address must be at least 10 characters")
      .max(500, "Address is too long"),

    gpsCoordinates: z
      .string()
      .regex(
        /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/,
        "GPS coordinates must be in format: latitude, longitude (e.g., -17.8252, 31.0335)"
      )
      .optional(),

    // Contact Information (head teacher info will be auto-populated from logged-in user's profile)
    alternativeContactName: z
      .string()
      .max(200, "Name is too long")
      .optional(),

    alternativeContactPhone: z
      .string()
      .regex(phoneRegex, "Please enter a valid Zimbabwe phone number")
      .optional()
      .or(z.literal("")),

    // School Demographics
    totalStudents: z
      .number()
      .int("Must be a whole number")
      .positive("Total students must be greater than 0")
      .max(10000, "Please verify student count"),

    maleStudents: z
      .number()
      .int("Must be a whole number")
      .nonnegative("Cannot be negative")
      .optional(),

    femaleStudents: z
      .number()
      .int("Must be a whole number")
      .nonnegative("Cannot be negative")
      .optional(),

    totalTeachers: z
      .number()
      .int("Must be a whole number")
      .positive("Total teachers must be greater than 0")
      .max(500, "Please verify teacher count"),

    gradesOffered: z
      .string()
      .min(3, "Please specify grades offered (e.g., 'ECD-Grade 7' or 'Form 1-6')")
      .max(100, "Grades description is too long"),

    // Infrastructure & Current State
    hasElectricity: z.boolean().optional(),
    hasRunningWater: z.boolean().optional(),
    hasLibrary: z.boolean().optional(),
    hasComputerLab: z.boolean().optional(),

    numberOfClassrooms: z
      .number()
      .int("Must be a whole number")
      .positive("Must have at least 1 classroom")
      .max(200, "Please verify classroom count"),

    classroomCondition: z.enum(["Good", "Fair", "Poor"], {
      message: "Please select classroom condition",
    }),

    // Food Security Status
    hasFeedingProgram: z.boolean().optional(),

    feedingProgramDetails: z
      .string()
      .max(1000, "Details are too long")
      .optional(),

    studentsRequiringMeals: z
      .number()
      .int("Must be a whole number")
      .nonnegative("Cannot be negative")
      .optional(),

    // Financial Status
    schoolFeesAmount: z
      .number()
      .nonnegative("Cannot be negative")
      .max(1000000, "Please verify fees amount")
      .optional(),

    percentageFeePaying: z
      .number()
      .int("Must be a whole number")
      .min(0, "Percentage must be between 0 and 100")
      .max(100, "Percentage must be between 0 and 100")
      .optional(),

    // Document Uploads
    registrationCertificate: fileSchema,
    headTeacherId: fileSchema,
    schoolPhoto: fileSchema,
    classroomPhoto: fileSchema,
    additionalDocument: optionalFileSchema,
  })
  .refine(
    (data) => {
      // If students requiring meals is specified, it shouldn't exceed total students
      if (
        data.studentsRequiringMeals !== undefined &&
        data.studentsRequiringMeals > data.totalStudents
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Students requiring meals cannot exceed total student enrollment",
      path: ["studentsRequiringMeals"],
    }
  )
  .refine(
    (data) => {
      // If male and female students are both provided, they should sum to approximately total
      if (
        data.maleStudents !== undefined &&
        data.femaleStudents !== undefined
      ) {
        const sum = data.maleStudents + data.femaleStudents;
        // Allow small discrepancy for rounding
        if (Math.abs(sum - data.totalStudents) > 10) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Male + Female students should approximately equal total students",
      path: ["maleStudents"],
    }
  )
  .refine(
    (data) => {
      // If feeding program exists, require details
      if (data.hasFeedingProgram && !data.feedingProgramDetails) {
        return false;
      }
      return true;
    },
    {
      message: "Please provide details about the feeding program",
      path: ["feedingProgramDetails"],
    }
  );

// Input type (what the form receives - FileList from file inputs)
export type SchoolRegistrationFormInput = z.input<
  typeof schoolRegistrationSchema
>;

// Output type (after transformations - FileList → File)
export type SchoolRegistrationFormData = z.output<
  typeof schoolRegistrationSchema
>;

// Harare districts for dropdown
export const HARARE_DISTRICTS = [
  "Harare Central",
  "Harare North",
  "Harare South",
  "Harare East",
  "Harare West",
  "Chitungwiza",
  "Epworth",
  "Norton",
  "Ruwa",
] as const;

// School types
export const SCHOOL_TYPES = ["Primary", "Secondary", "Combined"] as const;

// Classroom conditions
export const CLASSROOM_CONDITIONS = ["Good", "Fair", "Poor"] as const;
