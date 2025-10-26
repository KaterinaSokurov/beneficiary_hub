import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, Mail, Home, Shield } from "lucide-react";

export default async function DonorPendingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "donor") {
    redirect("/auth/login");
  }

  // Check if donor details exist
  const { data: donorData } = await supabase
    .from("donors")
    .select("*")
    .eq("id", user.id)
    .single();

  // If no donor details, redirect to registration
  if (!donorData) {
    redirect("/auth/register-donor");
  }

  // If verified and active, redirect to dashboard
  if (donorData.is_verified && donorData.verification_status === "approved") {
    redirect("/donor");
  }

  // If rejected, show different message
  if (donorData.verification_status === "rejected") {
    redirect("/auth/login?error=rejected");
  }

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-3xl">Verification Pending</CardTitle>
          <CardDescription className="text-base">
            Thank you for registering, {donorData.full_name || profile.email}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Your account is currently under review by our verification team.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Verification Status: {donorData.verification_status}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Registration Completed</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Email Verification</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Document Review</span>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Identity Verification</span>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Account Activation</span>
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">What's Next?</h3>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground pl-4">
              <li>
                <span className="font-medium text-foreground">Document Review:</span> Our team is reviewing your uploaded documents
              </li>
              <li>
                <span className="font-medium text-foreground">Identity Verification:</span> We'll verify your identification information
              </li>
              <li>
                <span className="font-medium text-foreground">Background Check:</span> Standard compliance and AML verification
              </li>
              <li>
                <span className="font-medium text-foreground">Account Activation:</span> Once approved, you can start making donations
              </li>
            </ol>
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <span className="font-semibold">Verification Timeline:</span> Most verifications are completed within 24-48 hours.
              You'll receive an email notification once your account is approved.
            </AlertDescription>
          </Alert>

          <Alert className="bg-green-50 border-green-200">
            <Mail className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              We've sent a confirmation email to <span className="font-semibold">{profile.email}</span>.
              Please check your inbox and spam folder.
            </AlertDescription>
          </Alert>

          <div className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Questions about your verification? Contact us at{" "}
              <a href="mailto:verification@beneficiaryhub.com" className="text-primary hover:underline">
                verification@beneficiaryhub.com
              </a>
            </p>
            <div className="flex justify-center gap-3">
              <form action={async () => {
                "use server";
                const supabase = await createClient();
                await supabase.auth.signOut();
                redirect("/auth/login");
              }}>
                <Button variant="outline" type="submit">
                  Sign Out
                </Button>
              </form>
              <Link href="/">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
