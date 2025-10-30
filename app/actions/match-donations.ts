"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateDonationMatches } from "@/lib/ai-matching-service";
import { sendDonationAllocationEmail } from "@/lib/email-service";

export async function generateMatchRecommendations(donationId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const adminClient = createAdminClient();

    // Fetch the donation details
    const { data: donation, error: donationError } = await adminClient
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .eq("approval_status", "approved")
      .single();

    if (donationError || !donation) {
      return { success: false, error: "Donation not found or not approved" };
    }

    // Fetch all submitted/approved applications from schools
    const { data: applications, error: applicationsError } = await adminClient
      .from("resource_applications")
      .select("*")
      .in("status", ["submitted", "under_review", "approved"]);

    if (applicationsError || !applications || applications.length === 0) {
      return { success: false, error: "No applications found to match" };
    }

    // Fetch school details separately (school_id = profiles.id = schools.id)
    const schoolIds = [...new Set(applications.map(app => app.school_id))];
    const { data: schools, error: schoolsError } = await adminClient
      .from("schools")
      .select("*")
      .in("id", schoolIds);

    if (schoolsError) {
      return { success: false, error: "Error fetching school details" };
    }

    // Create a map of schools by ID for quick lookup
    const schoolsMap = new Map(schools?.map(school => [school.id, school]) || []);

    // Transform data for AI matching, combining applications with school data
    const formattedApplications = applications.map((app: any) => {
      const school = schoolsMap.get(app.school_id);
      if (!school) {
        console.warn(`School not found for application ${app.id}`);
      }
      return {
        id: app.id,
        application_title: app.application_title,
        application_type: app.application_type,
        priority_level: app.priority_level,
        resources_needed: app.resources_needed,
        current_situation: app.current_situation,
        expected_impact: app.expected_impact,
        beneficiaries_count: app.beneficiaries_count,
        needed_by_date: app.needed_by_date,
        school: school ? {
          id: school.id,
          school_name: school.school_name,
          province: school.province,
          district: school.district,
          total_students: school.total_students,
          total_teachers: school.total_teachers,
          students_requiring_meals: school.students_requiring_meals,
          has_electricity: school.has_electricity,
          has_running_water: school.has_running_water,
          has_library: school.has_library,
          classroom_condition: school.classroom_condition,
        } : null,
      };
    }).filter(app => app.school !== null); // Only include applications with valid school data

    // Generate AI-powered match recommendations
    const recommendations = await generateDonationMatches(
      donation as any,
      formattedApplications
    );

    // Store recommendations in donation_matches table
    const matchRecords = recommendations.map((rec) => ({
      donation_id: donationId,
      application_id: rec.application_id,
      school_id: rec.school_id,
      match_score: rec.match_score,
      match_justification: rec.match_justification,
      priority_rank: rec.priority_rank,
      status: "pending_admin_allocation",
    }));

    // Delete existing recommendations for this donation
    await adminClient
      .from("donation_matches")
      .delete()
      .eq("donation_id", donationId);

    // Insert new recommendations and get them back with IDs
    const { data: insertedMatches, error: insertError } = await adminClient
      .from("donation_matches")
      .insert(matchRecords)
      .select();

    if (insertError || !insertedMatches) {
      console.error("Error storing match recommendations:", insertError);
      return { success: false, error: insertError?.message || "Failed to store matches" };
    }

    // Fetch school details for the inserted matches
    const matchSchoolIds = [...new Set(insertedMatches.map(m => m.school_id))];
    const { data: matchSchools } = await adminClient
      .from("schools")
      .select("school_name, province, district, total_students, id")
      .in("id", matchSchoolIds);

    const { data: matchApplications } = await adminClient
      .from("resource_applications")
      .select("application_title, application_type, priority_level, current_situation, expected_impact, id")
      .in("id", insertedMatches.map(m => m.application_id));

    // Enrich matches with school and application data
    const matchSchoolsMap = new Map(matchSchools?.map(s => [s.id, s]) || []);
    const matchAppsMap = new Map(matchApplications?.map(a => [a.id, a]) || []);

    const enrichedMatches = insertedMatches.map(match => ({
      ...match,
      schools: matchSchoolsMap.get(match.school_id),
      resource_applications: matchAppsMap.get(match.application_id),
    }));

    return { success: true, matches: enrichedMatches };
  } catch (error) {
    console.error("Error generating match recommendations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function allocateDonationToSchool(
  matchId: string,
  adminNotes?: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const adminClient = createAdminClient();

    // Get match details with donation info
    const { data: match, error: matchError } = await adminClient
      .from("donation_matches")
      .select(`
        *,
        donations (
          title
        )
      `)
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return { success: false, error: "Match not found" };
    }

    // Get school details for email
    const { data: school, error: schoolError } = await adminClient
      .from("schools")
      .select("school_name, id")
      .eq("id", match.school_id)
      .single();

    if (schoolError || !school) {
      return { success: false, error: "School not found" };
    }

    // Get school profile for email
    const { data: schoolProfile, error: schoolProfileError } = await adminClient
      .from("profiles")
      .select("email")
      .eq("id", match.school_id)
      .single();

    if (schoolProfileError || !schoolProfile) {
      return { success: false, error: "School profile not found" };
    }

    // Update match status to allocated
    const { error: updateMatchError } = await adminClient
      .from("donation_matches")
      .update({
        status: "allocated_by_admin",
        allocated_by: user.id,
        allocated_at: new Date().toISOString(),
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (updateMatchError) {
      console.error("Error updating match:", updateMatchError);
      return { success: false, error: updateMatchError.message };
    }

    // Update donation to show it's allocated (pending approver confirmation)
    const { error: donationError } = await adminClient
      .from("donations")
      .update({
        allocated_to: match.school_id,
        allocated_at: new Date().toISOString(),
        status: "allocated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.donation_id);

    if (donationError) {
      console.error("Error updating donation:", donationError);
      return { success: false, error: donationError.message };
    }

    // Send allocation notification email to school
    const donation = match.donations as any;
    if (donation && schoolProfile.email && school.school_name) {
      await sendDonationAllocationEmail(
        schoolProfile.email,
        school.school_name,
        donation.title,
        match.match_score
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error allocating donation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getMatchRecommendations(donationId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const adminClient = createAdminClient();

    // Fetch matches with related application data
    const { data: matches, error } = await adminClient
      .from("donation_matches")
      .select(`
        *,
        resource_applications (
          application_title,
          application_type,
          priority_level,
          current_situation,
          expected_impact
        )
      `)
      .eq("donation_id", donationId)
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
      .select("school_name, province, district, total_students, id")
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
    console.error("Error fetching match recommendations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
