import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CreateDonationForm } from "@/components/donor/create-donation-form";

export default async function NewDonationPage() {
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
    redirect("/");
  }

  const { data: donorData } = await supabase
    .from("donors")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!donorData || !donorData.is_verified) {
    redirect("/donor/pending");
  }

  return (
    <DashboardLayout
      role="donor"
      userName={donorData.full_name || profile.email}
      userEmail={profile.email}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Create New Donation</h2>
          <p className="text-muted-foreground mt-2">
            List resources you'd like to donate to schools in need
          </p>
        </div>
        <CreateDonationForm />
      </div>
    </DashboardLayout>
  );
}
