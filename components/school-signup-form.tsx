"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  schoolSignupSchema,
  type SchoolSignupFormData,
} from "@/lib/validations/school-signup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { School, Loader2, AlertCircle } from "lucide-react";

export function SchoolSignupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolSignupFormData>({
    resolver: zodResolver(schoolSignupSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: SchoolSignupFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Step 1: Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.headTeacherName,
            role: "school",
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Failed to create account");

      // Step 2: Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.headTeacherName,
        phone_number: data.phone,
        role: "school",
        is_active: false, // Inactive until school details are completed and approved
      });

      if (profileError) throw profileError;

      // Redirect to school registration form to complete details
      router.push("/auth/register-school");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <School className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold">School Registration</CardTitle>
          </div>
          <CardDescription>
            Create your account to register your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">
                School Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="schoolName"
                {...register("schoolName")}
                placeholder="Enter school name"
              />
              {errors.schoolName && (
                <p className="text-sm text-destructive">
                  {errors.schoolName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headTeacherName">
                Head Teacher Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="headTeacherName"
                {...register("headTeacherName")}
                placeholder="Full name"
              />
              {errors.headTeacherName && (
                <p className="text-sm text-destructive">
                  {errors.headTeacherName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="headteacher@school.co.zw"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This email will be used to login to your account
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+263771234567"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Must contain uppercase, lowercase, number, special character"
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account & Continue"
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
