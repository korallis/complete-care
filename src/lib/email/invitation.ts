/**
 * Invitation email template.
 */
import { sendEmail } from './index';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3200';
const APP_NAME = 'Complete Care';

type InvitationEmailData = {
  token: string;
  orgName: string;
  inviterName: string;
  role: string;
};

/** Human-readable role labels */
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  senior_carer: 'Senior Carer',
  carer: 'Carer',
  viewer: 'Viewer',
};

/**
 * Sends a team invitation email to the invitee.
 */
export async function sendInvitationEmail(
  toEmail: string,
  data: InvitationEmailData,
): Promise<void> {
  const { token, orgName, inviterName, role } = data;
  const acceptUrl = `${APP_URL}/invitations/accept?token=${token}`;
  const roleLabel = ROLE_LABELS[role] ?? role;

  await sendEmail({
    to: toEmail,
    subject: `You've been invited to join ${orgName} on ${APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited!</h2>
        <p>
          <strong>${inviterName}</strong> has invited you to join
          <strong>${orgName}</strong> on ${APP_NAME} as a <strong>${roleLabel}</strong>.
        </p>
        <p>Click the button below to accept the invitation and set up your account:</p>
        <p>
          <a href="${acceptUrl}" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This invitation expires in 7 days. If you don't want to join, you can safely ignore this email.
        </p>
        <p style="color: #999; font-size: 12px;">Or copy and paste this URL: ${acceptUrl}</p>
      </div>
    `,
    text: `You've been invited to join ${orgName} on ${APP_NAME}!\n\n${inviterName} has invited you as a ${roleLabel}.\n\nAccept your invitation here:\n${acceptUrl}\n\nThis invitation expires in 7 days.`,
  });
}
