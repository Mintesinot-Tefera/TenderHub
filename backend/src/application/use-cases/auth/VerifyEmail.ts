import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITokenService } from '../../services/ITokenService';
import { AuthResultDTO } from '../../dtos/AuthDTO';
import { ValidationError } from '../../../domain/errors/AppError';
import { toPublicUser } from '../../../domain/entities/User';

export class VerifyEmail {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService
  ) {}

  async execute(token: string): Promise<AuthResultDTO> {
    if (!token) {
      throw new ValidationError('Verification token is required');
    }

    const user = await this.userRepo.findByVerificationToken(token);
    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    if (user.emailVerified) {
      throw new ValidationError('Email is already verified');
    }

    await this.userRepo.verifyEmail(user.id);

    const jwt = this.tokenService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: toPublicUser({ ...user, emailVerified: true, verificationToken: null }), token: jwt };
  }
}
