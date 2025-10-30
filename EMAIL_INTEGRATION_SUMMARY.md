# Email Integration Summary

## Overview
Complete email notification system has been integrated into the Beneficiary Hub application. All emails are sent via Gmail SMTP using Nodemailer.

## Demo Mode Configuration
For presentation purposes, all emails are redirected to a single test recipient while maintaining the intended recipient information in the email content.

**Test Recipient:** `sodir24125@ametitas.com`

Each email includes a demo mode banner showing the originally intended recipient, making it perfect for demonstrations and presentations.

## Email Service Configuration

### Environment Variables (`.env.local`)
```env
# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=achipote999@gmail.com
SMTP_PASSWORD=etrpcaczpssnzruw
EMAIL_FROM=achipote999@gmail.com
EMAIL_FROM_NAME=Beneficiary Hub

# Test/Demo Mode - All emails sent to this address for presentation
EMAIL_TEST_RECIPIENT=sodir24125@ametitas.com
```

## Integrated Email Notifications

### 1. Donor Registration Workflow

#### Donor Approval Email
- **Triggered:** When admin approves a donor registration
- **File:** `app/actions/donor-approvals.ts` → `approveDonor()`
- **Template:** `sendDonorApprovalEmail()`
- **Content:**
  - Congratulatory message
  - Next steps to get started
  - Login instructions

#### Donor Rejection Email
- **Triggered:** When admin rejects a donor registration
- **File:** `app/actions/donor-approvals.ts` → `rejectDonor()`
- **Template:** `sendDonorRejectionEmail()`
- **Content:**
  - Rejection notification
  - Reason for rejection
  - Contact information for support

---

### 2. School Registration Workflow

#### School Approval Email
- **Triggered:** When admin approves a school registration
- **File:** `app/actions/school-approvals.ts` → `approveSchool()`
- **Template:** `sendSchoolApprovalEmail()`
- **Content:**
  - Congratulatory message
  - Next steps to submit applications
  - Profile completion guidance

#### School Rejection Email
- **Triggered:** When admin rejects a school registration
- **File:** `app/actions/school-approvals.ts` → `rejectSchool()`
- **Template:** `sendSchoolRejectionEmail()`
- **Content:**
  - Rejection notification
  - Reason for rejection
  - Contact information for support

---

### 3. Donation Management Workflow

#### Donation Approval Email
- **Triggered:** When admin approves a donation listing
- **File:** `app/actions/manage-donations.ts` → `approveDonation()`
- **Template:** `sendDonationApprovalEmail()`
- **Content:**
  - Approval confirmation
  - Donation title
  - Visibility to schools notification
  - Next steps

#### Donation Rejection Email
- **Triggered:** When admin rejects a donation listing
- **File:** `app/actions/manage-donations.ts` → `rejectDonation()`
- **Template:** `sendDonationRejectionEmail()`
- **Content:**
  - Rejection notification
  - Donation title
  - Reason for rejection
  - Contact information

---

### 4. Donation Allocation Workflow

#### Donation Allocation Email
- **Triggered:** When admin allocates a donation to a school
- **File:** `app/actions/match-donations.ts` → `allocateDonationToSchool()`
- **Template:** `sendDonationAllocationEmail()`
- **Content:**
  - Allocation confirmation to school
  - Donation title
  - AI match score (percentage)
  - Pending approver confirmation notice
  - Next steps

---

### 5. Handover Scheduling Workflow

#### Handover Notification Email (Donor)
- **Triggered:** When approver schedules handover and approves match
- **File:** `app/actions/approve-matches.ts` → `approveMatch()`
- **Template:** `sendHandoverNotificationEmail(recipientType: 'donor')`
- **Content:**
  - Handover scheduled confirmation
  - Date, time, and venue details
  - School name receiving the donation
  - Contact person and phone number
  - Additional notes
  - Professional formatted details box

#### Handover Notification Email (School)
- **Triggered:** When approver schedules handover and approves match
- **File:** `app/actions/approve-matches.ts` → `approveMatch()`
- **Template:** `sendHandoverNotificationEmail(recipientType: 'school')`
- **Content:**
  - Handover scheduled confirmation
  - Date, time, and venue details
  - Donor information
  - Contact person and phone number
  - Additional notes
  - Professional formatted details box

---

## Email Template Features

All email templates include:
- **HTML Version:** Professional design with gradients, color-coded headers, and responsive layout
- **Plain Text Version:** Fallback for email clients that don't support HTML
- **Branding:** "Beneficiary Hub - Connecting Donors with Schools in Need" footer
- **Demo Mode Banner:** Yellow banner showing original intended recipient when in demo mode
- **Consistent Styling:**
  - Green (#16a34a) for approvals
  - Red (#dc2626) for rejections
  - Blue (#2563eb) for informational/allocation messages

## Testing

### Test Scripts

1. **Basic Email Test:** `scripts/test-email.ts`
   - Verifies SMTP connection
   - Sends a single test email
   - Run with: `npx tsx scripts/test-email.ts`

2. **Comprehensive Template Test:** `scripts/test-all-email-templates.ts`
   - Tests all 9 email templates
   - Shows demo mode in action
   - Verifies each template with realistic data
   - Run with: `npx tsx scripts/test-all-email-templates.ts`

### Test Results
```
✅ All 9 email templates tested successfully
✅ Demo mode working correctly (all sent to sodir24125@ametitas.com)
✅ Original recipient information preserved in email content
```

## Email Service Architecture

### Core Service (`lib/email-service.ts`)

**Functions:**
- `sendEmail(options)` - Core email sending function
- `verifyEmailConnection()` - SMTP connection verification
- `getSMTPConfig()` - Dynamic SMTP configuration with credentials validation
- `getTransporter()` - Reusable Nodemailer transporter

**Template Functions:**
- `sendDonorApprovalEmail()`
- `sendDonorRejectionEmail()`
- `sendSchoolApprovalEmail()`
- `sendSchoolRejectionEmail()`
- `sendDonationApprovalEmail()`
- `sendDonationRejectionEmail()`
- `sendDonationAllocationEmail()`
- `sendHandoverNotificationEmail()`

### Demo Mode Implementation

When `EMAIL_TEST_RECIPIENT` is set in environment:
1. All outgoing emails are redirected to the test recipient
2. A yellow demo banner is added to HTML emails
3. Demo mode prefix is added to plain text emails
4. Console logs show original and actual recipients
5. Email content still addresses the originally intended recipient

Example console output:
```javascript
[Email] Message sent successfully (Demo Mode): {
  messageId: '<abc123...>',
  originalRecipient: 'school@example.com',
  actualRecipient: 'sodir24125@ametitas.com'
}
```

## Workflow Integration Points

| Workflow | Action File | Function | Email Template |
|----------|------------|----------|----------------|
| Donor Approval | `donor-approvals.ts` | `approveDonor()` | Donor Approval |
| Donor Rejection | `donor-approvals.ts` | `rejectDonor()` | Donor Rejection |
| School Approval | `school-approvals.ts` | `approveSchool()` | School Approval |
| School Rejection | `school-approvals.ts` | `rejectSchool()` | School Rejection |
| Donation Approval | `manage-donations.ts` | `approveDonation()` | Donation Approval |
| Donation Rejection | `manage-donations.ts` | `rejectDonation()` | Donation Rejection |
| Allocation to School | `match-donations.ts` | `allocateDonationToSchool()` | Donation Allocation |
| Handover Scheduling | `approve-matches.ts` | `approveMatch()` | Handover (Donor & School) |

## Production Deployment Notes

To switch from demo mode to production mode:

1. **Remove or comment out** `EMAIL_TEST_RECIPIENT` from `.env.local`:
   ```env
   # EMAIL_TEST_RECIPIENT=sodir24125@ametitas.com
   ```

2. Emails will automatically be sent to actual recipients
3. Demo mode banners will no longer appear
4. Console logs will show standard format

## Security Considerations

- Gmail app-specific password is used (not regular password)
- Credentials stored in `.env.local` (not committed to git)
- `.env.local` should be added to `.gitignore`
- SMTP connection uses STARTTLS encryption (port 587)

## Support and Troubleshooting

### Common Issues

**Emails not being received:**
- Check spam/junk folder
- Verify `EMAIL_TEST_RECIPIENT` is set correctly
- Run `npx tsx scripts/test-email.ts` to verify SMTP connection

**SMTP authentication errors:**
- Ensure app-specific password is correct
- Verify Gmail account has 2FA enabled
- Check that SMTP settings match Gmail requirements

**Template rendering issues:**
- All templates have both HTML and plain text versions
- Email clients will automatically choose the appropriate version
- Test with `scripts/test-all-email-templates.ts`

## Future Enhancements

Potential improvements for production:
- Email delivery tracking and analytics
- Unsubscribe functionality
- Email queue for high-volume sending
- Multiple language support
- Custom email templates per school/organization
- Email notification preferences per user

---

**Status:** ✅ Fully Implemented and Tested
**Last Updated:** 2025-01-30
**Test Coverage:** 9/9 templates passing
