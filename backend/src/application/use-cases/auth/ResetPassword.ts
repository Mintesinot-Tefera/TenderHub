import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../services/IPasswordHasher';
import { ValidationError } from '../../../domain/errors/AppError';

export class ResetPassword {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher
  ) {}

  async execute(token: string, newPassword: string): Promise<{ message: string }> {
    const record = await this.userRepo.findByResetToken(token);

    if (!record) {
      throw new ValidationError('Invalid or expired password reset link');
    }

    if (record.expiresAt < new Date()) {
      throw new ValidationError('Password reset link has expired');
    }

    const passwordHash = await this.hasher.hash(newPassword);
    await this.userRepo.setPassword(record.userId, passwordHash);
    await this.userRepo.clearResetToken(record.userId);

    return { message: 'Password reset successfully. You can now sign in with your new password.' };
  }
}
