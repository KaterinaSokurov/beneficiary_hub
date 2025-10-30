"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendDonationApprovalEmail, sendDonationRejectionEmail } from "@/lib/email-service";

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

    // Get donation and donor details for email
    const { data: donation, error: fetchError } = await adminClient
      .from("donations")
      .select(`
        title,
        donor_id,
        donors (
          full_name,
          email
        )
      `)
      .eq("id", donationId)
      .single();

    if (fetchError || !donation || !donation.donors) {
      return { success: false, error: "Donation or donor not found" };
    }

    const donor = Array.isArray(donation.donors) ? donation.donors[0] : donation.donors;

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

    // Send approval email to donor
    await sendDonationApprovalEmail(
      donor.email,
      donor.full_name,
      donation.title
    );

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

    // Get donation and donor details for email
    const { data: donation, error: fetchError } = await adminClient
      .from("donations")
      .select(`
        title,
        donor_id,
        donors (
          full_name,
          email
        )
      `)
      .eq("id", donationId)
      .single();

    if (fetchError || !donation || !donation.donors) {
      return { success: false, error: "Donation or donor not found" };
    }

    const donor = Array.isArray(donation.donors) ? donation.donors[0] : donation.donors;

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

    // Send rejection email to donor
    await sendDonationRejectionEmail(
      donor.email,
      donor.full_name,
      donation.title,
      rejectionReason
    );

    return { success: true };
  } catch (error) {
    console.error("Error in rejectDonation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
