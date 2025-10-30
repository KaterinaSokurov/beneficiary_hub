/**
 * Comprehensive Email Templates Test Script
 *
 * Tests all email templates integrated throughout the system.
 * All emails will be sent to sodir24125@ametitas.com but will show the intended recipient.
 *
 * Run with: npx tsx scripts/test-all-email-templates.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import email functions after env vars are loaded
import {
  sendDonorApprovalEmail,
  sendDonorRejectionEmail,
  sendSchoolApprovalEmail,
  sendSchoolRejectionEmail,
  sendDonationApprovalEmail,
  sendDonationRejectionEmail,
  sendDonationAllocationEmail,
  sendHandoverNotificationEmail,
} from '@/lib/email-service';

async function testAllEmailTemplates() {
  console.log('\n📧 Comprehensive Email Templates Test\n');
  console.log('='.repeat(60));
  console.log('\nAll emails will be sent to: sodir24125@ametitas.com');
  console.log('Each email will show the originally intended recipient');
  console.log('='.repeat(60));

  const results: { name: string; success: boolean; error?: string }[] = [];

  // Test 1: Donor Approval Email
  console.log('\n[1/8] Testing Donor Approval Email...');
  try {
    const result = await sendDonorApprovalEmail(
      'john.donor@example.com',
      'John Donor'
    );
    results.push({ name: 'Donor Approval', success: result.success, error: result.error });
    console.log(result.success ? '✅ Sent successfully' : `❌ Failed: ${result.error}`);
  } catch (error) {
    results.push({ name: 'Donor Approval', success: false, error: String(error) });
    console.log('❌ Error:', error);
  }

  // Test 2: Donor Rejection Email
  console.log('\n[2/8] Testing Donor Rejection Email...');
  try {
    const result = await sendDonorRejectionEmail(
      'jane.donor@example.com',
      'Jane Donor',
      'Unable to verify provided identification documents'
    );
    results.push({ name: 'Donor Rejection', success: result.success, error: result.error });
    console.log(result.success ? '✅ Sent successfully' : `❌ Failed: ${result.error}`);
  } catch (error) {
    results.push({ name: 'Donor Rejection', success: false, error: String(error) });
    console.log('❌ Error:', error);
  }

  // Test 3: School Approval Email
  console.log('\n[3/8] Testing School Approval Email...');
  try {
    const result = await sendSchoolApprovalEmail(
      'principal@maplewood.edu',
      'Maplewood Primary School'
    );
    results.push({ name: 'School Approval', success: result.success, error: result.error });
    console.log(result.success ? '✅ Sent successfully' : `❌ Failed: ${result.error}`);
  } catch (error) {
    results.push({ name: 'School Approval', success: false, error: String(error) });
    console.log('❌ Error:', error);
  }

  // Test 4: School Rejection Email
  console.log('\n[4/8] Testing School Rejection Email...');
  try {
    const result = await sendSchoolRejectionEmail(
      'admin@riverside.edu',
      'Riverside High School',
      'School registration documents do not match official records'
    );
    results.push({ name: 'School Rejection', success: result.success, error: result.error });
    console.log(result.success ? '✅ Sent successfully' : `❌ Failed: ${result.error}`);
  } catch (error) {
    results.push({ name: 'School Rejection', success: false, error: String(error) });
    console.log('❌ Error:', error);
  }

  // Test 5: Donation Approval Email
  console.log('\n[5/8] Testing Donation Approval Email...');
  try {
    const result = await sendDonationApprovalEmail(
      'sarah.donor@example.com',
      'Sarah Smith',
      '100 Mathematics Textbooks'
    );
    results.push({ name: 'Donation Approval', success: result.success, error: result.error });
    console.log(result.success ? '✅ Sent successfully' : `❌ Failed: ${result.error}`);
  } catch (error) {
    results.push({ name: 'Donation Approval', success: false, error: String(error) });
    console.log('❌ Error:', error);
  }

  // Test 6: Donation Rejection Email
  console.log('\n[6/8] Testing Donation Rejection Email...');
  try {
    const result = await sendDonationRejectionEmail(
      'mike.donor@example.com',
      'Mike Johnson',
      'Used Computer Equipment (20 units)',
      'Items do not meet our quality standards for educational use'
    );
    results.push({ name: 'Donation Rejection', success: result.success, error: result.error });
    console.log(result.success ? '✅ Sent successfully' : `❌ Failed: ${result.error}`);
  } catch (error) {
    results.push({ name: 'Donation Rejection', success: false, error: String(error) });
    console.log('❌ Error:', error);
  }

  // Test 7: Donation Allocation Email
  console.log('\n[7/8] Testing Donation Allocation Email...');
  try {
    const result = await sendDonationAllocationEmail(
      'principal@greenvalley.edu',
      'Green Valley Primary School',
      'Science Lab Equipment',
      95
    );
    results.push({ name: 'Donation Allocation', success: result.success, error: result.error });
    console.log(result.success ? '✅ Sent successfully' : `❌ Failed: ${result.error}`);
  } catch (error) {
    results.push({ name: 'Donation Allocation', success: false, error: String(error) });
    console.log('❌ Error:', error);
  }

  // Test 8a: Handover Notification Email (Donor)
  console.log('\n[8a/8] Testing Handover Notification Email (Donor)...');
  try {
    const result = await sendHandoverNotificationEmail(
      'emma.donor@example.com',
      'Emma Williams',
      'donor',
      {
        donationTitle: 'Sports Equipment Donation',
        schoolName: 'Oakwood Secondary School',
        date: '2025-02-15',
        time: '10:00 AM',
        venue: 'School Main Office',
        venueAddress: '123 Education Road, Harare',
        contactPerson: 'Mr. Patrick Moyo (Head Teacher)',
        contactPhone: '+263 77 123 4567',
        notes: 'Please bring ID and park at the visitor parking area',
      }
    );
    results.push({ name: 'Handover (Donor)', success: result.success, error: result.error });
    console.log(result.success ? '✅ Sent successfully' : `❌ Failed: ${result.error}`);
  } catch (error) {
    results.push({ name: 'Handover (Donor)', success: false, error: String(error) });
    console.log('❌ Error:', error);
  }

  // Test 8b: Handover Notification Email (School)
  console.log('\n[8b/8] Testing Handover Notification Email (School)...');
  try {
    const result = await sendHandoverNotificationEmail(
      'principal@oakwood.edu',
      'Oakwood Secondary School',
      'school',
      {
        donationTitle: 'Sports Equipment Donation',
        schoolName: 'Oakwood Secondary School',
        date: '2025-02-15',
        time: '10:00 AM',
        venue: 'School Main Office',
        venueAddress: '123 Education Road, Harare',
        contactPerson: 'Mr. Patrick Moyo (Head Teacher)',
        contactPhone: '+263 77 123 4567',
        notes: 'Please have staff available to help unload equipment',
      }
    );
    results.push({ name: 'Handover (School)', success: result.success, error: result.error });
    console.log(result.success ? '✅ Sent successfully' : `❌ Failed: ${result.error}`);
  } catch (error) {
    results.push({ name: 'Handover (School)', success: false, error: String(error) });
    console.log('❌ Error:', error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n✅ Successful: ${successful}/${results.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}/${results.length}`);
    console.log('\nFailed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n📬 Check inbox at sodir24125@ametitas.com for all test emails');
  console.log('   (Also check spam/junk folder)\n');

  console.log('🎯 Email Templates Tested:');
  console.log('   1. Donor Approval - Sent when admin approves donor registration');
  console.log('   2. Donor Rejection - Sent when admin rejects donor registration');
  console.log('   3. School Approval - Sent when admin approves school registration');
  console.log('   4. School Rejection - Sent when admin rejects school registration');
  console.log('   5. Donation Approval - Sent when admin approves a donation');
  console.log('   6. Donation Rejection - Sent when admin rejects a donation');
  console.log('   7. Donation Allocation - Sent when admin allocates donation to school');
  console.log('   8. Handover Notification - Sent to both donor and school when approver schedules handover');

  console.log('\n' + '='.repeat(60) + '\n');

  return successful === results.length;
}

// Run the test
testAllEmailTemplates()
  .then((allPassed) => {
    if (allPassed) {
      console.log('✨ All email template tests passed!\n');
      process.exit(0);
    } else {
      console.log('💥 Some email template tests failed. Check the summary above.\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
