"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function approveMatch(matchId: string, approverNotes?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify approver or admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["approver", "admin"].includes(profile.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const adminClient = createAdminClient();

    // Get match details
    const { data: match, error: matchError } = await adminClient
      .from("donation_matches")
      .select("*")
      .eq("id", matchId)
      .eq("status", "allocated_by_admin")
      .single();

    if (matchError || !match) {
      return { success: false, error: "Match not found or not ready for approval" };
    }

    // Update match status to approved
    const { error: updateMatchError } = await adminClient
      .from("donation_matches")
      .update({
        status: "approved_by_approver",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        approver_notes: approverNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (updateMatchError) {
      console.error("Error updating match:", updateMatchError);
      return { success: false, error: updateMatchError.message };
    }

    // Update donation status - keep allocated status but mark as fully approved
    const { error: donationError } = await adminClient
      .from("donations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.donation_id);

    if (donationError) {
      console.error("Error updating donation:", donationError);
      return { success: false, error: donationError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error approving match:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function rejectMatch(matchId: string, rejectionReason: string, approverNotes?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify approver or admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["approver", "admin"].includes(profile.role)) {
      return { success: false, error: "Unauthorized" };
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return { success: false, error: "Rejection reason is required" };
    }

    const adminClient = createAdminClient();

    // Get match details
    const { data: match, error: matchError } = await adminClient
      .from("donation_matches")
      .select("*")
      .eq("id", matchId)
      .eq("status", "allocated_by_admin")
      .single();

    if (matchError || !match) {
      return { success: false, error: "Match not found or not ready for review" };
    }

    // Update match status to rejected
    const { error: updateMatchError } = await adminClient
      .from("donation_matches")
      .update({
        status: "rejected_by_approver",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
        approver_notes: approverNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (updateMatchError) {
      console.error("Error updating match:", updateMatchError);
      return { success: false, error: updateMatchError.message };
    }

    // Update donation status back to approved (unallocated)
    const { error: donationError } = await adminClient
      .from("donations")
      .update({
        allocated_to: null,
        allocated_at: null,
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.donation_id);

    if (donationError) {
      console.error("Error updating donation:", donationError);
      return { success: false, error: donationError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error rejecting match:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPendingMatches() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify approver or admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["approver", "admin"].includes(profile.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const adminClient = createAdminClient();

    const { data: matches, error } = await adminClient
      .from("donation_matches")
      .select(`
        *,
        donations (
          title,
          description,
          donation_type,
          condition,
          available_quantity,
          city,
          province,
          donors (
            full_name
          )
        ),
        resource_applications (
          application_title,
          application_type,
          priority_level,
          current_situation,
          expected_impact,
          beneficiaries_count
        ),
        schools:school_id (
          school_name,
          province,
          district,
          total_students,
          head_teacher_name,
          head_teacher_phone
        ),
        allocated_by_profile:allocated_by (
          full_name,
          email
        )
      `)
      .eq("status", "allocated_by_admin")
      .order("priority_rank", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, matches: matches || [] };
  } catch (error) {
    console.error("Error fetching pending matches:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getMatchHistory() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify approver or admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["approver", "admin"].includes(profile.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const adminClient = createAdminClient();

    const { data: matches, error } = await adminClient
      .from("donation_matches")
      .select(`
        *,
        donations (
          title,
          donation_type
        ),
        schools:school_id (
          school_name
        )
      `)
      .in("status", ["approved_by_approver", "rejected_by_approver"])
      .order("reviewed_at", { ascending: false })
      .limit(50);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, matches: matches || [] };
  } catch (error) {
    console.error("Error fetching match history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
