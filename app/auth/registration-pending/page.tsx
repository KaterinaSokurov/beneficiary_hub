import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, Mail, Home } from "lucide-react";

export default function RegistrationPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-3xl">Registration Submitted</CardTitle>
          <CardDescription className="text-base">
            Thank you for registering as a donor!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Mail className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              We've sent a confirmation email to your inbox. Please verify your email address.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What happens next?
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground pl-4">
              <li>
                <span className="font-medium text-foreground">Email Verification:</span> Check your email and click the verification link
              </li>
              <li>
                <span className="font-medium text-foreground">Admin Review:</span> Our team will review your registration details within 24-48 hours
              </li>
              <li>
                <span className="font-medium text-foreground">Identity Verification:</span> We'll verify your identification information for security and trust
              </li>
              <li>
                <span className="font-medium text-foreground">Account Activation:</span> Once approved, you'll receive an email and can start making a difference
              </li>
            </ol>
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <span className="font-semibold">Verification Timeline:</span> Most registrations are reviewed within 24-48 hours. You'll receive an email notification once your account is approved.
            </AlertDescription>
          </Alert>

          <div className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Questions about your registration? Contact us at{" "}
              <a href="mailto:support@beneficiaryhub.com" className="text-primary hover:underline">
                support@beneficiaryhub.com
              </a>
            </p>
            <div className="flex justify-center">
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
