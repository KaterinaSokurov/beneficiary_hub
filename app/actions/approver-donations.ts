"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function finalApproveDonation(donationId: string) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verify user is approver
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

    if (!profile || profile.role !== "approver") {
      return { success: false, error: "Unauthorized - approver role required" };
    }

    // Check donation is pending final approval
    const { data: donation } = await adminClient
      .from("donations")
      .select("approval_status")
      .eq("id", donationId)
      .single();

    if (!donation || donation.approval_status !== "pending_final_approval") {
      return { success: false, error: "Donation not pending final approval" };
    }

    // Give final approval
    const { error: updateError } = await adminClient
      .from("donations")
      .update({
        approval_status: "approved",
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", donationId);

    if (updateError) {
      console.error("Error giving final approval:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in finalApproveDonation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function finalRejectDonation(donationId: string, rejectionReason: string) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verify user is approver
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

    if (!profile || profile.role !== "approver") {
      return { success: false, error: "Unauthorized - approver role required" };
    }

    if (!rejectionReason.trim()) {
      return { success: false, error: "Rejection reason is required" };
    }

    // Reject donation
    const { error: updateError } = await adminClient
      .from("donations")
      .update({
        approval_status: "rejected",
        status: "rejected",
        rejection_reason: rejectionReason,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", donationId);

    if (updateError) {
      console.error("Error rejecting donation:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in finalRejectDonation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
