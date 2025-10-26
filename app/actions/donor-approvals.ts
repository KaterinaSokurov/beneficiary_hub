"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveDonor(donorId: string) {
  try {
    const adminClient = createAdminClient();

    // Get current admin user to set verified_by
    const { data: { user } } = await adminClient.auth.getUser();

    // Update donor record
    const { error: donorError } = await adminClient
      .from("donors")
      .update({
        verification_status: "approved",
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user?.id || null,
      })
      .eq("id", donorId);

    if (donorError) throw donorError;

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

    // Update donor record with rejection
    const { error: donorError } = await adminClient
      .from("donors")
      .update({
        verification_status: "rejected",
        is_verified: false,
        verified_by: user?.id || null,
        // Note: rejection_reason is stored in reason parameter but not in donors table
        // Consider adding a rejection_reason field to donors table if needed
      })
      .eq("id", donorId);

    if (donorError) throw donorError;

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
