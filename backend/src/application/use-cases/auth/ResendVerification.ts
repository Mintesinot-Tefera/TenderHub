import crypto from 'crypto';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEmailService } from '../../services/IEmailService';

export class ResendVerification {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(email.toLowerCase());

    // Always return the same message to avoid email enumeration
    if (!user || user.emailVerified) {
      return { message: 'If that email exists and is unverified, a new link has been sent.' };
    }

    const newToken = crypto.randomUUID();
    await this.userRepo.setVerificationToken(user.id, newToken);
    await this.emailService.sendVerificationEmail(user.email, newToken);

    return { message: 'If that email exists and is unverified, a new link has been sent.' };
  }
}
