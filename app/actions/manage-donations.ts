"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function approveDonation(donationId: string) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Update donation status
    const { error: updateError } = await adminClient
      .from("donations")
      .update({
        approval_status: "approved",
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", donationId);

    if (updateError) {
      console.error("Error approving donation:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in approveDonation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function rejectDonation(donationId: string, rejectionReason: string) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    if (!rejectionReason.trim()) {
      return { success: false, error: "Rejection reason is required" };
    }

    // Update donation status
    const { error: updateError } = await adminClient
      .from("donations")
      .update({
        approval_status: "rejected",
        status: "rejected",
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", donationId);

    if (updateError) {
      console.error("Error rejecting donation:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in rejectDonation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
