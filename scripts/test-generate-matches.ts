/**
 * Test script to simulate the exact match generation flow
 * Run with: npx tsx scripts/test-generate-matches.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { generateDonationMatches } from '../lib/ai-matching-service';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!;

async function testGenerateMatches() {
  console.log("🧪 Testing Match Generation Flow\n");
  console.log("=" .repeat(60));

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase configuration!");
    console.log("SUPABASE_URL:", SUPABASE_URL ? "✓ Set" : "✗ Missing");
    console.log("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing");
    process.exit(1);
  }

  const adminClient = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Step 1: Get an approved donation
    console.log("\n📦 Step 1: Fetching approved donation...");
    const { data: donation, error: donationError } = await adminClient
      .from("donations")
      .select("*")
      .eq("approval_status", "approved")
      .eq("status", "approved")
      .limit(1)
      .single();

    if (donationError || !donation) {
      console.error("❌ No approved donations found!");
      console.error(donationError);
      process.exit(1);
    }

    console.log("✅ Found donation:");
    console.log(`   ID: ${donation.id}`);
    console.log(`   Title: ${donation.title}`);
    console.log(`   Type: ${donation.donation_type}`);
    console.log(`   Location: ${donation.city}, ${donation.province}`);

    // Step 2: Get submitted applications
    console.log("\n🏫 Step 2: Fetching submitted applications...");
    const { data: applications, error: applicationsError } = await adminClient
      .from("resource_applications")
      .select("*")
      .in("status", ["submitted", "under_review", "approved"]);

    if (applicationsError || !applications || applications.length === 0) {
      console.error("❌ No applications found!");
      console.error(applicationsError);
      process.exit(1);
    }

    // Fetch school details separately
    const schoolIds = [...new Set(applications.map(app => app.school_id))];
    const { data: schools, error: schoolsError } = await adminClient
      .from("schools")
      .select("*")
      .in("id", schoolIds);

    if (schoolsError) {
      console.error("❌ Error fetching schools!");
      console.error(schoolsError);
      process.exit(1);
    }

    const schoolsMap = new Map(schools?.map(school => [school.id, school]) || []);

    console.log(`✅ Found ${applications.length} applications:`);
    applications.forEach((app: any, idx: number) => {
      const school = schoolsMap.get(app.school_id);
      console.log(`   ${idx + 1}. ${school?.school_name || 'Unknown'} - ${app.application_title}`);
      console.log(`      Type: ${app.application_type}, Priority: ${app.priority_level}`);
    });

    // Step 3: Transform data for AI matching
    console.log("\n🔄 Step 3: Transforming data for AI matching...");
    const formattedApplications = applications.map((app: any) => {
      const school = schoolsMap.get(app.school_id);
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
    }).filter(app => app.school !== null);

    console.log(`✅ Transformed ${formattedApplications.length} applications`);

    // Step 4: Generate AI-powered match recommendations
    console.log("\n🤖 Step 4: Generating AI match recommendations...");
    console.log("   This will call Claude API...\n");

    const startTime = Date.now();
    const recommendations = await generateDonationMatches(
      donation as any,
      formattedApplications
    );
    const endTime = Date.now();

    console.log(`\n✅ Generated ${recommendations.length} recommendations in ${endTime - startTime}ms`);

    // Step 5: Display recommendations
    console.log("\n" + "=".repeat(60));
    console.log("🎯 MATCH RECOMMENDATIONS:");
    console.log("=".repeat(60));

    recommendations.forEach((rec, idx) => {
      console.log(`\n${idx + 1}. ${rec.school_name} (Rank #${rec.priority_rank})`);
      console.log(`   Application: ${rec.application_id}`);
      console.log(`   Match Score: ${rec.match_score}%`);
      console.log(`   Justification:`);
      console.log(`   ${rec.match_justification}`);
      console.log("   " + "-".repeat(55));
    });

    // Step 6: Store in database
    console.log("\n💾 Step 6: Storing recommendations in database...");

    const matchRecords = recommendations.map((rec) => ({
      donation_id: donation.id,
      application_id: rec.application_id,
      school_id: rec.school_id,
      match_score: rec.match_score,
      match_justification: rec.match_justification,
      priority_rank: rec.priority_rank,
      status: "pending_admin_allocation",
    }));

    // Delete existing recommendations for this donation
    const { error: deleteError } = await adminClient
      .from("donation_matches")
      .delete()
      .eq("donation_id", donation.id);

    if (deleteError) {
      console.error("⚠️  Error deleting old recommendations:", deleteError);
    } else {
      console.log("✅ Cleared old recommendations");
    }

    // Insert new recommendations
    const { error: insertError, data: insertedData } = await adminClient
      .from("donation_matches")
      .insert(matchRecords)
      .select();

    if (insertError) {
      console.error("❌ Error storing recommendations:", insertError);
      process.exit(1);
    }

    console.log(`✅ Stored ${insertedData?.length || 0} recommendations in database`);

    // Step 7: Verify we can retrieve them
    console.log("\n🔍 Step 7: Verifying stored recommendations...");

    const { data: storedMatches, error: fetchError } = await adminClient
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
      .eq("donation_id", donation.id)
      .order("priority_rank", { ascending: true });

    if (fetchError) {
      console.error("❌ Error fetching stored recommendations:", fetchError);
      process.exit(1);
    }

    // Fetch school details for stored matches
    if (storedMatches && storedMatches.length > 0) {
      const matchSchoolIds = [...new Set(storedMatches.map(m => m.school_id))];
      const { data: matchSchools } = await adminClient
        .from("schools")
        .select("*")
        .in("id", matchSchoolIds);

      const matchSchoolsMap = new Map(matchSchools?.map(s => [s.id, s]) || []);
      storedMatches.forEach((match: any) => {
        match.schools = matchSchoolsMap.get(match.school_id);
      });
    }

    console.log(`✅ Retrieved ${storedMatches?.length || 0} matches from database`);

    if (storedMatches && storedMatches.length > 0) {
      console.log("\n📋 Retrieved match structure:");
      console.log(JSON.stringify(storedMatches[0], null, 2));
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=".repeat(60) + "\n");

    console.log("💡 Summary:");
    console.log(`   - Donation ID: ${donation.id}`);
    console.log(`   - Generated ${recommendations.length} AI matches`);
    console.log(`   - Stored in database: ✓`);
    console.log(`   - Can be retrieved: ✓`);
    console.log("\n   The dialog should now be able to load these matches!");

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testGenerateMatches();
