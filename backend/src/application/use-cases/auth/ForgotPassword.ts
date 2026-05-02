import crypto from 'crypto';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEmailService } from '../../services/IEmailService';

export class ForgotPassword {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    // Always return the same message to prevent user enumeration
    const message =
      'If an account with that email exists, a password reset link has been sent.';

    const user = await this.userRepo.findByEmail(email.toLowerCase());

    if (!user) return { message };

    // Google-only accounts have no password to reset
    if (!user.passwordHash && user.googleId) return { message };

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepo.setResetToken(user.id, token, expiresAt);

    this.emailService
      .sendPasswordResetEmail(user.email, token)
      .catch((err) => console.error('[ForgotPassword] Failed to send reset email:', err));

    return { message };
  }
}
