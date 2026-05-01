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
