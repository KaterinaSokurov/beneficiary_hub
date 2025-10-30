/**
 * Email Service using Nodemailer and Gmail SMTP
 *
 * This service handles all email communications for the Beneficiary Hub system.
 */

import nodemailer from 'nodemailer';

// Email configuration from environment variables
function getSMTPConfig() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.error('[Email] Missing SMTP credentials:', {
      user: user ? '✓' : '✗',
      pass: pass ? '✓' : '✗',
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
    });
  }

  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass,
    },
  };
}

const EMAIL_FROM = {
  address: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
  name: process.env.EMAIL_FROM_NAME || 'Beneficiary Hub',
};

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(getSMTPConfig());
  }
  return transporter;
}

// Email sending interface
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const config = getSMTPConfig();
    if (!config.auth.user || !config.auth.pass) {
      throw new Error('SMTP credentials not configured');
    }

    const transport = getTransporter();

    // Get original recipient for logging
    const originalRecipient = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    // Override recipient with test email if configured (for demo/presentation)
    const testRecipient = process.env.EMAIL_TEST_RECIPIENT;
    const actualRecipient = testRecipient || originalRecipient;

    // Add note to email if using test recipient
    let emailHtml = options.html;
    let emailText = options.text;

    if (testRecipient && testRecipient !== originalRecipient) {
      const testNote = `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>📧 Demo Mode:</strong> This email was originally intended for <strong>${originalRecipient}</strong>
          </p>
        </div>
      `;
      emailHtml = emailHtml ? testNote + emailHtml : emailHtml;
      emailText = emailText ? `[DEMO MODE - Originally for: ${originalRecipient}]\n\n${emailText}` : emailText;
    }

    const mailOptions = {
      from: `${EMAIL_FROM.name} <${EMAIL_FROM.address}>`,
      to: actualRecipient,
      subject: options.subject,
      html: emailHtml,
      text: emailText,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      replyTo: options.replyTo,
    };

    const info = await transport.sendMail(mailOptions);

    if (testRecipient && testRecipient !== originalRecipient) {
      console.log(`[Email] Message sent successfully (Demo Mode):`, {
        messageId: info.messageId,
        originalRecipient,
        actualRecipient,
      });
    } else {
      console.log('[Email] Message sent successfully:', info.messageId);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('[Email] SMTP connection verified successfully');
    return { success: true };
  } catch (error) {
    console.error('[Email] SMTP connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Email Templates

/**
 * Send donation approval notification to donor
 */
export async function sendDonationApprovalEmail(donorEmail: string, donorName: string, donationTitle: string) {
  return sendEmail({
    to: donorEmail,
    subject: `Donation Approved: ${donationTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Donation Approved!</h2>
        <p>Dear ${donorName},</p>
        <p>We are pleased to inform you that your donation "<strong>${donationTitle}</strong>" has been approved by our admin team.</p>
        <p>Your donation is now visible to schools in need and will be considered for matching with suitable resource applications.</p>
        <p>Thank you for your generosity in supporting education!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">Beneficiary Hub - Connecting Donors with Schools in Need</p>
      </div>
    `,
    text: `Dear ${donorName},\n\nYour donation "${donationTitle}" has been approved! It is now visible to schools in need.\n\nThank you for your generosity!\n\nBeneficiary Hub`,
  });
}

/**
 * Send donation rejection notification to donor
 */
export async function sendDonationRejectionEmail(
  donorEmail: string,
  donorName: string,
  donationTitle: string,
  rejectionReason: string
) {
  return sendEmail({
    to: donorEmail,
    subject: `Donation Status Update: ${donationTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Donation Status Update</h2>
        <p>Dear ${donorName},</p>
        <p>We regret to inform you that your donation "<strong>${donationTitle}</strong>" could not be approved at this time.</p>
        <p><strong>Reason:</strong> ${rejectionReason}</p>
        <p>If you have any questions or would like to resubmit your donation with corrections, please contact our support team.</p>
        <p>Thank you for your interest in supporting education.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">Beneficiary Hub - Connecting Donors with Schools in Need</p>
      </div>
    `,
    text: `Dear ${donorName},\n\nYour donation "${donationTitle}" could not be approved.\n\nReason: ${rejectionReason}\n\nPlease contact us if you have questions.\n\nBeneficiary Hub`,
  });
}

/**
 * Send handover notification to donor and school
 */
export async function sendHandoverNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  recipientType: 'donor' | 'school',
  details: {
    donationTitle: string;
    schoolName: string;
    date: string;
    time: string;
    venue: string;
    venueAddress: string;
    contactPerson: string;
    contactPhone: string;
    notes?: string;
  }
) {
  const isSchool = recipientType === 'school';
  const otherParty = isSchool ? 'donor' : details.schoolName;

  return sendEmail({
    to: recipientEmail,
    subject: `Handover Scheduled: ${details.donationTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Handover Scheduled!</h2>
        <p>Dear ${recipientName},</p>
        <p>A handover has been scheduled for the donation: <strong>${details.donationTitle}</strong></p>

        ${isSchool ? `<p>You will be receiving this donation from a generous donor.</p>` : `<p>Your donation will be delivered to <strong>${details.schoolName}</strong>.</p>`}

        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Handover Details</h3>
          <p><strong>Date:</strong> ${details.date}</p>
          <p><strong>Time:</strong> ${details.time}</p>
          <p><strong>Venue:</strong> ${details.venue}</p>
          <p><strong>Address:</strong> ${details.venueAddress}</p>
          <p><strong>Contact Person:</strong> ${details.contactPerson}</p>
          <p><strong>Contact Phone:</strong> ${details.contactPhone}</p>
          ${details.notes ? `<p><strong>Additional Notes:</strong> ${details.notes}</p>` : ''}
        </div>

        <p>Please ensure you arrive on time. If you have any questions or need to reschedule, please contact the person listed above.</p>

        <p>Thank you for being part of this meaningful exchange!</p>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">Beneficiary Hub - Connecting Donors with Schools in Need</p>
      </div>
    `,
    text: `Dear ${recipientName},\n\nHandover scheduled for: ${details.donationTitle}\n\nDate: ${details.date}\nTime: ${details.time}\nVenue: ${details.venue}\nAddress: ${details.venueAddress}\nContact: ${details.contactPerson} (${details.contactPhone})\n${details.notes ? `\nNotes: ${details.notes}` : ''}\n\nBeneficiary Hub`,
  });
}

/**
 * Send school approval notification
 */
export async function sendSchoolApprovalEmail(schoolEmail: string, schoolName: string) {
  return sendEmail({
    to: schoolEmail,
    subject: 'School Registration Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Registration Approved!</h2>
        <p>Dear ${schoolName},</p>
        <p>Your school registration has been approved. You can now log in and submit resource applications to receive donations.</p>
        <p>To get started:</p>
        <ol>
          <li>Log in to your account</li>
          <li>Complete your school profile</li>
          <li>Submit resource applications for items you need</li>
        </ol>
        <p>We look forward to helping connect you with generous donors!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">Beneficiary Hub - Connecting Donors with Schools in Need</p>
      </div>
    `,
    text: `Dear ${schoolName},\n\nYour school registration has been approved! Log in to start submitting resource applications.\n\nBeneficiary Hub`,
  });
}

/**
 * Send donor approval notification
 */
export async function sendDonorApprovalEmail(donorEmail: string, donorName: string) {
  return sendEmail({
    to: donorEmail,
    subject: 'Donor Registration Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Registration Approved!</h2>
        <p>Dear ${donorName},</p>
        <p>Your donor registration has been verified and approved. You can now log in and start making donations!</p>
        <p>To get started:</p>
        <ol>
          <li>Log in to your account</li>
          <li>Browse schools in need or create a donation listing</li>
          <li>Track your donation's impact</li>
        </ol>
        <p>Thank you for choosing to make a difference in education!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">Beneficiary Hub - Connecting Donors with Schools in Need</p>
      </div>
    `,
    text: `Dear ${donorName},\n\nYour donor registration has been approved! Log in to start making donations.\n\nThank you for making a difference!\n\nBeneficiary Hub`,
  });
}

/**
 * Send donor rejection notification
 */
export async function sendDonorRejectionEmail(
  donorEmail: string,
  donorName: string,
  rejectionReason: string
) {
  return sendEmail({
    to: donorEmail,
    subject: 'Donor Registration Status Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Registration Status Update</h2>
        <p>Dear ${donorName},</p>
        <p>Thank you for your interest in becoming a donor on Beneficiary Hub. Unfortunately, we are unable to approve your registration at this time.</p>
        <p><strong>Reason:</strong> ${rejectionReason}</p>
        <p>If you believe this was an error or would like to address the issue, please contact our support team.</p>
        <p>We appreciate your interest in supporting education.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">Beneficiary Hub - Connecting Donors with Schools in Need</p>
      </div>
    `,
    text: `Dear ${donorName},\n\nUnfortunately, we are unable to approve your donor registration at this time.\n\nReason: ${rejectionReason}\n\nPlease contact us if you have questions.\n\nBeneficiary Hub`,
  });
}

/**
 * Send school rejection notification
 */
export async function sendSchoolRejectionEmail(
  schoolEmail: string,
  schoolName: string,
  rejectionReason: string
) {
  return sendEmail({
    to: schoolEmail,
    subject: 'School Registration Status Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Registration Status Update</h2>
        <p>Dear ${schoolName},</p>
        <p>Thank you for your application to join Beneficiary Hub. Unfortunately, we are unable to approve your school registration at this time.</p>
        <p><strong>Reason:</strong> ${rejectionReason}</p>
        <p>If you believe this was an error or would like to address the issue, please contact our support team.</p>
        <p>We appreciate your interest in our platform.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">Beneficiary Hub - Connecting Donors with Schools in Need</p>
      </div>
    `,
    text: `Dear ${schoolName},\n\nUnfortunately, we are unable to approve your school registration at this time.\n\nReason: ${rejectionReason}\n\nPlease contact us if you have questions.\n\nBeneficiary Hub`,
  });
}

/**
 * Send donation allocation notification to school
 */
export async function sendDonationAllocationEmail(
  schoolEmail: string,
  schoolName: string,
  donationTitle: string,
  matchScore: number
) {
  return sendEmail({
    to: schoolEmail,
    subject: `Donation Allocated: ${donationTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Great News - Donation Allocated!</h2>
        <p>Dear ${schoolName},</p>
        <p>A donation has been allocated to your school: <strong>${donationTitle}</strong></p>
        <p>This allocation was made based on AI-powered matching with a match score of <strong>${matchScore}%</strong>, considering your school's needs and the donation's characteristics.</p>

        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #1e40af;">Next Steps</h3>
          <p style="margin: 5px 0;">The allocation is currently pending final approval from our approver team. Once approved:</p>
          <ul style="margin: 10px 0;">
            <li>You will receive handover details via email</li>
            <li>A handover date, time, and venue will be scheduled</li>
            <li>You can coordinate with the donor for delivery</li>
          </ul>
        </div>

        <p>Please keep an eye on your email for further updates regarding this donation.</p>
        <p>Thank you for being part of Beneficiary Hub!</p>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">Beneficiary Hub - Connecting Donors with Schools in Need</p>
      </div>
    `,
    text: `Dear ${schoolName},\n\nGreat news! A donation has been allocated to your school: ${donationTitle}\n\nMatch Score: ${matchScore}%\n\nThe allocation is pending final approval. You will receive handover details once approved.\n\nBeneficiary Hub`,
  });
}
