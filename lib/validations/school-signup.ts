import { z } from "zod";

// Zimbabwe phone number validation (supports various formats)
const phoneRegex = /^(\+263|0)(7[1-9]|86|77)\d{7}$/;

export const schoolSignupSchema = z
  .object({
    schoolName: z
      .string()
      .min(3, "School name must be at least 3 characters")
      .max(200, "School name must be less than 200 characters")
      .regex(
        /^[a-zA-Z0-9\s\-.']+$/,
        "School name can only contain letters, numbers, spaces, hyphens, periods, and apostrophes"
      ),

    headTeacherName: z
      .string()
      .min(3, "Head teacher name must be at least 3 characters")
      .max(200, "Name is too long")
      .regex(
        /^[a-zA-Z\s\-.']+$/,
        "Name can only contain letters, spaces, hyphens, periods, and apostrophes"
      ),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .toLowerCase()
      .refine(
        (email) => {
          // Reject disposable email domains
          const disposableDomains = ["tempmail.com", "throwaway.email", "guerrillamail.com"];
          const domain = email.split("@")[1];
          return !disposableDomains.includes(domain);
        },
        { message: "Please use a valid email address" }
      ),

    phone: z
      .string()
      .regex(
        phoneRegex,
        "Please enter a valid Zimbabwe phone number (e.g., +263771234567 or 0771234567)"
      ),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character"
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SchoolSignupFormData = z.infer<typeof schoolSignupSchema>;
