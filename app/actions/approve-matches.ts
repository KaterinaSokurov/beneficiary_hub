"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface HandoverSchedule {
  scheduledDate: string;
  scheduledTime: string;
  venue: string;
  venueAddress: string;
  contactPerson: string;
  contactPhone: string;
  handoverNotes?: string;
}

export async function approveMatch(
  matchId: string,
  handoverSchedule: HandoverSchedule,
  approverNotes?: string
) {
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

    const now = new Date().toISOString();

    // Update match status to approved with handover details
    const { error: updateMatchError } = await adminClient
      .from("donation_matches")
      .update({
        status: "approved_by_approver",
        reviewed_by: user.id,
        reviewed_at: now,
        approver_notes: approverNotes,
        handover_scheduled_date: handoverSchedule.scheduledDate,
        handover_scheduled_time: handoverSchedule.scheduledTime,
        handover_venue: handoverSchedule.venue,
        handover_venue_address: handoverSchedule.venueAddress,
        handover_contact_person: handoverSchedule.contactPerson,
        handover_contact_phone: handoverSchedule.contactPhone,
        handover_notes: handoverSchedule.handoverNotes,
        donor_notified_at: now,
        school_notified_at: now,
        updated_at: now,
      })
      .eq("id", matchId);

    if (updateMatchError) {
      console.error("Error updating match:", updateMatchError);
      return { success: false, error: updateMatchError.message };
    }

    // Update donation status to delivered (handover scheduled)
    const { error: donationError } = await adminClient
      .from("donations")
      .update({
        status: "delivered",
        delivered_at: now,
        updated_at: now,
      })
      .eq("id", match.donation_id);

    if (donationError) {
      console.error("Error updating donation:", donationError);
      return { success: false, error: donationError.message };
    }

    // Update application status to fulfilled
    const { error: applicationError } = await adminClient
      .from("resource_applications")
      .update({
        status: "fulfilled",
        updated_at: now,
      })
      .eq("id", match.application_id);

    if (applicationError) {
      console.error("Error updating application:", applicationError);
      return { success: false, error: applicationError.message };
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

    // Fetch matches with donations, applications, and allocated_by profile
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

    if (!matches || matches.length === 0) {
      return { success: true, matches: [] };
    }

    // Fetch school details separately
    const schoolIds = [...new Set(matches.map(m => m.school_id))];
    const { data: schools, error: schoolsError } = await adminClient
      .from("schools")
      .select("school_name, province, district, total_students, head_teacher_name, head_teacher_phone, id")
      .in("id", schoolIds);

    if (schoolsError) {
      console.error("Error fetching schools:", schoolsError);
      return { success: true, matches }; // Return matches without school data
    }

    // Merge school data into matches
    const schoolsMap = new Map(schools?.map(s => [s.id, s]) || []);
    const enrichedMatches = matches.map(match => ({
      ...match,
      schools: schoolsMap.get(match.school_id),
    }));

    return { success: true, matches: enrichedMatches };
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
