"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendDonorApprovalEmail, sendDonorRejectionEmail } from "@/lib/email-service";

export async function approveDonor(donorId: string) {
  try {
    const adminClient = createAdminClient();

    // Get current admin user to set verified_by
    const { data: { user } } = await adminClient.auth.getUser();

    // Get donor details first for email
    const { data: donor, error: fetchError } = await adminClient
      .from("donors")
      .select("full_name, email")
      .eq("id", donorId)
      .single();

    if (fetchError || !donor) {
      throw new Error("Donor not found");
    }

    const now = new Date().toISOString();

    // Update donor record in donors table
    const { error: donorError } = await adminClient
      .from("donors")
      .update({
        verification_status: "approved",
        is_verified: true,
        verified_at: now,
        verified_by: user?.id || null,
        updated_at: now,
      })
      .eq("id", donorId);

    if (donorError) {
      console.error("Error updating donor record:", donorError);
      throw donorError;
    }

    // IMPORTANT: Also update profiles table - donor's profile must be activated and verified
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        is_active: true,
        is_verified: true,
        verification_status: "approved",
        verified_by: user?.id || null,
        verified_at: now,
        updated_at: now,
      })
      .eq("id", donorId);

    if (profileError) {
      console.error("Error updating donor profile:", profileError);
      throw profileError;
    }

    // Send approval email
    await sendDonorApprovalEmail(donor.email, donor.full_name);

    revalidatePath("/admin/donors");

    return { success: true };
  } catch (error) {
    console.error("Error approving donor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve donor",
    };
  }
}

export async function rejectDonor(donorId: string, reason: string) {
  try {
    const adminClient = createAdminClient();

    // Get current admin user to set verified_by
    const { data: { user } } = await adminClient.auth.getUser();

    // Get donor details first for email
    const { data: donor, error: fetchError } = await adminClient
      .from("donors")
      .select("full_name, email")
      .eq("id", donorId)
      .single();

    if (fetchError || !donor) {
      throw new Error("Donor not found");
    }

    const now = new Date().toISOString();

    // Update donor record with rejection in donors table
    const { error: donorError } = await adminClient
      .from("donors")
      .update({
        verification_status: "rejected",
        is_verified: false,
        verified_by: user?.id || null,
        verified_at: now,
        updated_at: now,
        // Note: rejection_reason is stored in reason parameter but not in donors table
        // Consider adding a rejection_reason field to donors table if needed
      })
      .eq("id", donorId);

    if (donorError) {
      console.error("Error updating donor record:", donorError);
      throw donorError;
    }

    // IMPORTANT: Also update profiles table - keep profile inactive and mark as rejected
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        is_active: false,
        is_verified: false,
        verification_status: "rejected",
        verified_by: user?.id || null,
        verified_at: now,
        updated_at: now,
      })
      .eq("id", donorId);

    if (profileError) {
      console.error("Error updating donor profile:", profileError);
      throw profileError;
    }

    // Send rejection email
    await sendDonorRejectionEmail(donor.email, donor.full_name, reason);

    revalidatePath("/admin/donors");

    return { success: true };
  } catch (error) {
    console.error("Error rejecting donor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject donor",
    };
  }
}
