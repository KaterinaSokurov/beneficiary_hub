/**
 * Test script for AI matching system
 * Run with: npx tsx scripts/test-ai-matching.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { generateDonationMatches } from '../lib/ai-matching-service';

// Test data - using real IDs from the database
const testDonation = {
  id: "e4ec50e4-14da-40b8-9777-975dfe3d4e79",
  title: "Stationery Supplies",
  description: "Box of assorted stationery including pens, pencils, notebooks, and rulers",
  donation_type: "Educational Materials",
  items: [
    { name: "Pens", quantity: 100, unit: "pieces" },
    { name: "Pencils", quantity: 200, unit: "pieces" },
    { name: "Notebooks", quantity: 50, unit: "pieces" }
  ],
  condition: "New",
  available_quantity: 350,
  city: "Harare",
  province: "Harare",
  delivery_available: true,
  delivery_radius_km: 50,
  total_estimated_value: 500,
  urgency_level: "medium"
};

const testApplications = [
  {
    id: "a609f96b-7baf-4c2e-a76d-e5b36be58e07",
    application_title: "Stationery Requested",
    application_type: "Educational Materials",
    priority_level: "high",
    resources_needed: [
      { name: "Pens", quantity: 50, unit: "pieces" },
      { name: "Notebooks", quantity: 30, unit: "pieces" }
    ],
    current_situation: "Our school lacks basic stationery supplies for students in grades 1-3. Many students cannot afford to buy their own supplies.",
    expected_impact: "With these supplies, 150 students will be able to participate fully in class activities and complete their homework assignments.",
    beneficiaries_count: 150,
    needed_by_date: "2025-12-01",
    school: {
      id: "1e7d4ebf-627e-4a10-a290-f5c75c5a6695",
      school_name: "Test Primary School",
      province: "Harare",
      district: "Harare Central",
      total_students: 300,
      total_teachers: 15,
      students_requiring_meals: 200,
      has_electricity: true,
      has_running_water: false,
      has_library: false,
      classroom_condition: "Fair"
    }
  },
  {
    id: "234bf802-af9f-41f0-b461-d53bdc36898e",
    application_title: "Classroom Desks and Chairs",
    application_type: "Infrastructure",
    priority_level: "urgent",
    resources_needed: [
      { name: "Desks", quantity: 30, unit: "pieces" },
      { name: "Chairs", quantity: 60, unit: "pieces" }
    ],
    current_situation: "Grade 3 students are sitting on the floor due to lack of furniture.",
    expected_impact: "Students will have proper seating to improve learning conditions.",
    beneficiaries_count: 60,
    needed_by_date: "2025-11-15",
    school: {
      id: "ea1387ff-7cca-4a10-9410-e2ddb471357c",
      school_name: "Another School",
      province: "Harare",
      district: "Harare East",
      total_students: 200,
      total_teachers: 10,
      students_requiring_meals: 150,
      has_electricity: false,
      has_running_water: false,
      has_library: false,
      classroom_condition: "Poor"
    }
  }
];

async function testAIMatching() {
  console.log("🧪 Testing AI Matching System\n");
  console.log("=" .repeat(60));

  console.log("\n📦 DONATION:");
  console.log(`   Title: ${testDonation.title}`);
  console.log(`   Type: ${testDonation.donation_type}`);
  console.log(`   Location: ${testDonation.city}, ${testDonation.province}`);
  console.log(`   Quantity: ${testDonation.available_quantity} items`);

  console.log("\n🏫 APPLICATIONS TO MATCH:");
  testApplications.forEach((app, idx) => {
    console.log(`   ${idx + 1}. ${app.school.school_name} - ${app.application_title}`);
    console.log(`      Type: ${app.application_type}, Priority: ${app.priority_level}`);
  });

  console.log("\n🤖 Calling Claude API for matching...\n");

  try {
    const startTime = Date.now();
    const matches = await generateDonationMatches(testDonation, testApplications);
    const endTime = Date.now();

    console.log(`✅ SUCCESS! Generated ${matches.length} matches in ${endTime - startTime}ms\n`);
    console.log("=" .repeat(60));

    matches.forEach((match, idx) => {
      console.log(`\n🎯 MATCH #${idx + 1} (Rank ${match.priority_rank})`);
      console.log(`   School: ${match.school_name}`);
      console.log(`   Match Score: ${match.match_score}%`);
      console.log(`   Justification:`);
      console.log(`   ${match.match_justification}`);
      console.log("   " + "-".repeat(55));
    });

    console.log("\n" + "=" .repeat(60));
    console.log("✅ AI Matching System is working correctly!");
    console.log("=" .repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }

    console.log("\n🔍 DEBUGGING TIPS:");
    console.log("   1. Check that NEXT_PUBLIC_CLAUDE_API_KEY is set in .env.local");
    console.log("   2. Verify the API key is valid");
    console.log("   3. Check network connectivity");
    console.log("   4. Review the error message above for details\n");

    process.exit(1);
  }
}

// Run the test
testAIMatching();
