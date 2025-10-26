import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, Mail, Phone, School } from "lucide-react";

export default async function SchoolPendingPage() {
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

  if (!profile || profile.role !== "school") {
    redirect("/auth/login");
  }

  // Get school details
  const { data: school } = await supabase
    .from("schools")
    .select("school_name, approval_status, created_at")
    .eq("id", user.id)
    .single();

  // If account is active OR school is approved, redirect to dashboard
  if (profile.is_active || (school && school.approval_status === "approved")) {
    redirect("/school");
  }

  const handleSignOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Application Under Review</CardTitle>
            <CardDescription className="text-base mt-2">
              Your school registration is being reviewed by our administrators
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {school && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <School className="h-6 w-6 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-blue-900">{school.school_name}</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Submitted on {school.created_at ? new Date(school.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    }) : "N/A"}
                  </p>
                </div>
                <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {school.approval_status || "Pending"}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What happens next?
            </h4>
            <ul className="space-y-3 ml-7">
              <li className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-sm text-muted-foreground">
                  Our administrators will review your school registration details and uploaded documents
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-sm text-muted-foreground">
                  We may contact you if additional information is needed
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-sm text-muted-foreground">
                  Once approved, you'll receive an email notification and gain full access to your dashboard
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-sm text-muted-foreground">
                  Review typically takes 1-3 business days
                </p>
              </li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3">Need assistance?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href="mailto:support@beneficiaryhub.com" className="text-blue-600 hover:underline">
                  support@beneficiaryhub.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">+263 XX XXX XXXX</span>
              </div>
            </div>
          </div>

          <form action={handleSignOut} className="pt-4">
            <Button type="submit" variant="outline" className="w-full">
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
