/**
 * Email Service Test Script
 *
 * Tests the email sending functionality using Nodemailer and Gmail SMTP.
 * Run with: npx tsx scripts/test-email.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local FIRST (before importing email service)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import email service (after env vars are loaded)
import { sendEmail, verifyEmailConnection } from '@/lib/email-service';

async function testEmailService() {
  console.log('\n📧 Email Service Test\n');
  console.log('='.repeat(50));

  // Step 1: Verify SMTP connection
  console.log('\n[1/3] Verifying SMTP connection...');
  const connectionResult = await verifyEmailConnection();

  if (!connectionResult.success) {
    console.error('❌ SMTP connection failed:', connectionResult.error);
    process.exit(1);
  }

  console.log('✅ SMTP connection verified successfully');

  // Step 2: Send test email
  console.log('\n[2/3] Sending test email...');
  console.log('   To: sodir24125@ametitas.com');
  console.log('   From:', process.env.EMAIL_FROM);
  console.log('   Subject: Beneficiary Hub - Email Service Test');

  const emailResult = await sendEmail({
    to: 'sodir24125@ametitas.com',
    subject: 'Beneficiary Hub - Email Service Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Beneficiary Hub</h1>
          <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Email Service Test</p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Email Service Working Successfully! 🎉</h2>

          <p style="color: #4b5563; line-height: 1.6;">
            This is a test email from the Beneficiary Hub email service. If you're receiving this,
            it means the email configuration is working correctly.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #059669; margin-top: 0;">Configuration Details</h3>
            <ul style="color: #4b5563; line-height: 1.8;">
              <li><strong>SMTP Host:</strong> smtp.gmail.com</li>
              <li><strong>Port:</strong> 587</li>
              <li><strong>Security:</strong> STARTTLS</li>
              <li><strong>From:</strong> ${process.env.EMAIL_FROM}</li>
            </ul>
          </div>

          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0;">
              <strong>📌 Next Steps:</strong> The email service is ready to be integrated into the application workflows
              for donation notifications, approvals, and handover scheduling.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Sent at: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} (SAST)
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 20px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Beneficiary Hub - Connecting Donors with Schools in Need
          </p>
        </div>
      </div>
    `,
    text: `
Beneficiary Hub - Email Service Test
=====================================

Email Service Working Successfully!

This is a test email from the Beneficiary Hub email service. If you're receiving this,
it means the email configuration is working correctly.

Configuration Details:
- SMTP Host: smtp.gmail.com
- Port: 587
- Security: STARTTLS
- From: ${process.env.EMAIL_FROM}

Next Steps: The email service is ready to be integrated into the application workflows
for donation notifications, approvals, and handover scheduling.

Sent at: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} (SAST)

---
Beneficiary Hub - Connecting Donors with Schools in Need
    `,
  });

  if (!emailResult.success) {
    console.error('❌ Failed to send email:', emailResult.error);
    process.exit(1);
  }

  console.log('✅ Test email sent successfully');
  console.log('   Message ID:', emailResult.messageId);

  // Step 3: Summary
  console.log('\n[3/3] Test Summary');
  console.log('='.repeat(50));
  console.log('✅ SMTP connection verified');
  console.log('✅ Test email sent to sodir24125@ametitas.com');
  console.log('✅ Email service is ready for production use');

  console.log('\n📬 Please check the inbox at sodir24125@ametitas.com');
  console.log('   (Also check spam/junk folder if not in inbox)');

  console.log('\n🎯 Ready to integrate emails into:');
  console.log('   - Donation approval/rejection notifications');
  console.log('   - Handover scheduling notifications');
  console.log('   - School/donor registration approvals');
  console.log('   - Match allocation notifications');

  console.log('\n' + '='.repeat(50) + '\n');
}

// Run the test
testEmailService()
  .then(() => {
    console.log('✨ Email test completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Email test failed:', error);
    process.exit(1);
  });
