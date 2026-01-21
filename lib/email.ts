/**
 * Email service for AutiCare
 * Handles transactional emails (invitations, notifications, password reset)
 * Uses Resend for production email delivery
 */

import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface InviteEmailData {
  recipientEmail: string;
  senderName: string;
  childName: string;
  inviteToken: string;
  scopes: string[];
  expiresAt: Date;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send an email using Resend
 * Falls back to console logging when API key not configured
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, text, html } = options;

  // Use Resend if configured
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: 'AutiCare <onboarding@resend.dev>',
        to: [to],
        subject,
        text,
        html: html || undefined,
      });

      if (error) {
        console.error("[Email] Resend error:", error);
        return false;
      }

      console.log(`[Email] Sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error("[Email] Failed to send:", error);
      return false;
    }
  }

  // Development/Pilot fallback: Log to console
  console.log("\n========== EMAIL (DEV MODE) ==========");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("---------- TEXT ----------");
  console.log(text);
  if (html) {
    console.log("---------- HTML ----------");
    console.log(html);
  }
  console.log("==========================================\n");

  return true;
}

/**
 * Send care team invitation email
 */
export async function sendInviteEmail(data: InviteEmailData): Promise<boolean> {
  const { recipientEmail, senderName, childName, inviteToken, scopes, expiresAt } = data;

  const acceptUrl = `${APP_URL}/invites/${inviteToken}`;
  const scopeList = scopes.map(s => s.replace("_", " ").toLowerCase()).join(", ");
  const expiryDate = expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `${senderName} invited you to join ${childName}'s care team on AutiCare`;

  const text = `
Hello,

${senderName} has invited you to join the care team for ${childName} on AutiCare.

You will be granted access to: ${scopeList}

To accept this invitation, please click the link below or copy it into your browser:

${acceptUrl}

This invitation expires on ${expiryDate}.

If you don't have an AutiCare account yet, you'll be able to create one when accepting the invitation.

If you believe you received this email in error, you can safely ignore it.

Best regards,
The AutiCare Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Care Team Invitation</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8faf8; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6b8e6b 0%, #5a7d5a 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">AutiCare</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Care Team Invitation</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello,
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        <strong>${senderName}</strong> has invited you to join the care team for <strong>${childName}</strong> on AutiCare.
      </p>
      
      <div style="background: #f0f4f0; border-radius: 12px; padding: 16px; margin: 0 0 24px 0;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
          You will be granted access to:
        </p>
        <p style="color: #374151; font-size: 14px; margin: 0; text-transform: capitalize;">
          ${scopeList}
        </p>
      </div>
      
      <a href="${acceptUrl}" style="display: block; background: #6b8e6b; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: 600; text-align: center; margin: 0 0 24px 0;">
        Accept Invitation
      </a>
      
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
        Or copy this link into your browser:
      </p>
      <p style="color: #6b8e6b; font-size: 13px; word-break: break-all; margin: 0 0 24px 0;">
        ${acceptUrl}
      </p>
      
      <p style="color: #9ca3af; font-size: 13px; margin: 0;">
        This invitation expires on ${expiryDate}. If you don't have an account, you can create one when accepting.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8faf8; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        If you received this email in error, you can safely ignore it.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: recipientEmail, subject, text, html });
}

/**
 * Send notification when access is granted directly (existing user)
 */
export async function sendAccessGrantedEmail(data: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  childName: string;
  scopes: string[];
}): Promise<boolean> {
  const { recipientEmail, recipientName, senderName, childName, scopes } = data;
  const scopeList = scopes.map(s => s.replace("_", " ").toLowerCase()).join(", ");
  const dashboardUrl = `${APP_URL}/dashboard`;

  const subject = `You've been added to ${childName}'s care team on AutiCare`;

  const text = `
Hello ${recipientName},

${senderName} has added you to the care team for ${childName} on AutiCare.

You now have access to: ${scopeList}

Log in to your dashboard to get started: ${dashboardUrl}

Best regards,
The AutiCare Team
  `.trim();

  return sendEmail({ to: recipientEmail, subject, text });
}

/**
 * Send notification when access is revoked
 */
export async function sendAccessRevokedEmail(data: {
  recipientEmail: string;
  recipientName: string;
  childName: string;
}): Promise<boolean> {
  const { recipientEmail, recipientName, childName } = data;

  const subject = `Your access to ${childName}'s profile has been removed`;

  const text = `
Hello ${recipientName},

Your access to ${childName}'s care profile on AutiCare has been revoked by the parent/guardian.

If you believe this was done in error, please contact the family directly.

Best regards,
The AutiCare Team
  `.trim();

  return sendEmail({ to: recipientEmail, subject, text });
}

/**
 * Resend an invitation email
 */
export async function resendInviteEmail(data: InviteEmailData): Promise<boolean> {
  // Same as sendInviteEmail but can add "Reminder:" prefix
  const modifiedData = {
    ...data,
  };

  return sendInviteEmail(modifiedData);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: {
  recipientEmail: string;
  recipientName: string;
  resetToken: string;
  expiresAt: Date;
}): Promise<boolean> {
  const { recipientEmail, recipientName, resetToken, expiresAt } = data;

  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  const expiryTime = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60));

  const subject = "Reset your AutiCare password";

  const text = `
Hello ${recipientName},

We received a request to reset your password for your AutiCare account.

To reset your password, click the link below or copy it into your browser:

${resetUrl}

This link will expire in ${expiryTime} minutes.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The AutiCare Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8faf8; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6b8e6b 0%, #5a7d5a 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">AutiCare</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Password Reset</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello ${recipientName},
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        We received a request to reset your password for your AutiCare account.
      </p>
      
      <a href="${resetUrl}" style="display: block; background: #6b8e6b; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: 600; text-align: center; margin: 0 0 24px 0;">
        Reset Password
      </a>
      
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
        Or copy this link into your browser:
      </p>
      <p style="color: #6b8e6b; font-size: 13px; word-break: break-all; margin: 0 0 24px 0;">
        ${resetUrl}
      </p>
      
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin: 0 0 24px 0;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">
          ⏱️ This link will expire in ${expiryTime} minutes.
        </p>
      </div>
      
      <p style="color: #9ca3af; font-size: 13px; margin: 0;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8faf8; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        This is an automated message from AutiCare.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: recipientEmail, subject, text, html });
}
