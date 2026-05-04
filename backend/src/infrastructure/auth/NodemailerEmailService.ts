import nodemailer from 'nodemailer';
import { IEmailService } from '../../application/services/IEmailService';
import { env } from '../../config/env';

export class NodemailerEmailService implements IEmailService {
  private transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: false,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: `"TenderHub" <no-reply@tenderhub.com>`,
      to,
      subject: 'Reset your TenderHub password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1e40af">Reset your password</h2>
          <p>We received a request to reset your TenderHub password. Click the button below to choose a new one.</p>
          <a href="${resetUrl}"
             style="display:inline-block;margin:16px 0;padding:12px 24px;background:#1e40af;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
            Reset Password
          </a>
          <p style="color:#64748b;font-size:13px">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px">TenderHub — Tender Management Platform</p>
        </div>
      `,
    });
  }

  async sendBidSubmittedEmail(to: string, tenderTitle: string, tenderReference: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"TenderHub" <no-reply@tenderhub.com>`,
      to,
      subject: `New bid received for ${tenderReference}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1e40af">New Bid Received</h2>
          <p>A new bid has been submitted for your tender:</p>
          <div style="background:#f1f5f9;border-radius:6px;padding:16px;margin:16px 0">
            <p style="margin:0;font-weight:600">${tenderTitle}</p>
            <p style="margin:4px 0 0;color:#64748b;font-size:13px">Reference: ${tenderReference}</p>
          </div>
          <p>Log in to TenderHub to review the bid and take action.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px">TenderHub — Tender Management Platform</p>
        </div>
      `,
    });
  }

  async sendBidReviewedEmail(to: string, tenderTitle: string, status: 'ACCEPTED' | 'REJECTED'): Promise<void> {
    const isAccepted = status === 'ACCEPTED';
    const statusLabel = isAccepted ? 'Accepted' : 'Rejected';
    const statusColor = isAccepted ? '#16a34a' : '#dc2626';
    const message = isAccepted
      ? 'Congratulations! Your bid has been accepted. The organization will be in touch with next steps.'
      : 'Unfortunately, your bid was not selected for this tender. We encourage you to apply for other opportunities.';

    await this.transporter.sendMail({
      from: `"TenderHub" <no-reply@tenderhub.com>`,
      to,
      subject: `Your bid has been ${statusLabel.toLowerCase()} — ${tenderTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1e40af">Bid ${statusLabel}</h2>
          <div style="background:#f1f5f9;border-radius:6px;padding:16px;margin:16px 0">
            <p style="margin:0;font-weight:600">${tenderTitle}</p>
            <p style="margin:8px 0 0">
              Status: <span style="font-weight:600;color:${statusColor}">${statusLabel}</span>
            </p>
          </div>
          <p>${message}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px">TenderHub — Tender Management Platform</p>
        </div>
      `,
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${env.frontendUrl}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"TenderHub" <no-reply@tenderhub.com>`,
      to,
      subject: 'Verify your TenderHub email address',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1e40af">Welcome to TenderHub</h2>
          <p>Thanks for signing up. Please verify your email address to activate your account.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;margin:16px 0;padding:12px 24px;background:#1e40af;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
            Verify Email Address
          </a>
          <p style="color:#64748b;font-size:13px">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px">TenderHub — Tender Management Platform</p>
        </div>
      `,
    });
  }
}
