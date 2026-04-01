/**
 * Email sending utility.
 * In development (no SMTP configured): logs email content to console.
 * In production: uses SMTP via nodemailer (configure SMTP_HOST, SMTP_USER, SMTP_PASS).
 *
 * Future: swap for Resend/SendGrid/AWS SES by swapping the send() implementation.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3200';
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@complete-care.app';
const APP_NAME = 'Complete Care';

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends an email. Falls back to console.log if SMTP is not configured.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  // If SMTP is configured, send via nodemailer
  if (process.env.SMTP_HOST) {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    return;
  }

  // Development fallback — log to console
  console.log('\n📧 [Email — Development Mode]');
  console.log(`To: ${payload.to}`);
  console.log(`Subject: ${payload.subject}`);
  console.log('---');
  console.log(payload.text);
  console.log('---\n');
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

/** Sends a verification email to a newly registered user */
export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: `Verify your email — ${APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email address</h2>
        <p>Thanks for signing up to ${APP_NAME}. Click the link below to verify your email address:</p>
        <p>
          <a href="${verifyUrl}" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        <p style="color: #999; font-size: 12px;">Or copy and paste this URL: ${verifyUrl}</p>
      </div>
    `,
    text: `Verify your email address\n\nThanks for signing up to ${APP_NAME}.\n\nClick here to verify your email:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
}

/** Sends a password reset email */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: `Reset your password — ${APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your ${APP_NAME} account. Click the link below to set a new password:</p>
        <p>
          <a href="${resetUrl}" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="color: #999; font-size: 12px;">Or copy and paste this URL: ${resetUrl}</p>
      </div>
    `,
    text: `Reset your password\n\nYou requested a password reset for your ${APP_NAME} account.\n\nClick here to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
  });
}
