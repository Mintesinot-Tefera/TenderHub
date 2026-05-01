import { OAuth2Client } from 'google-auth-library';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITokenService } from '../../services/ITokenService';
import { AuthResultDTO } from '../../dtos/AuthDTO';
import { ValidationError } from '../../../domain/errors/AppError';
import { toPublicUser, UserRole } from '../../../domain/entities/User';
import { env } from '../../../config/env';

export interface GoogleAuthDTO {
  idToken: string;
  role?: UserRole;
}

export class GoogleAuthUser {
  private readonly client: OAuth2Client;

  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService
  ) {
    this.client = new OAuth2Client(env.googleClientId);
  }

  async execute(dto: GoogleAuthDTO): Promise<AuthResultDTO> {
    let ticket;
    try {
      ticket = await this.client.verifyIdToken({
        idToken: dto.idToken,
        audience: env.googleClientId,
      });
    } catch {
      throw new ValidationError('Invalid Google token');
    }

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new ValidationError('Invalid Google token payload');
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const fullName = payload.name ?? email.split('@')[0];
    const avatarUrl = payload.picture ?? null;

    // 1. Find by Google ID (returning user)
    let user = await this.userRepo.findByGoogleId(googleId);
    if (user) {
      const token = this.tokenService.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      return { user: toPublicUser(user), token };
    }

    // 2. Find by email — link Google to existing password account
    user = await this.userRepo.findByEmail(email);
    if (user) {
      await this.userRepo.linkGoogleId(user.id, googleId);
      if (!user.emailVerified) {
        await this.userRepo.verifyEmail(user.id);
      }
      user = (await this.userRepo.findById(user.id))!;
    } else {
      // 3. New user — create Google account (email already verified by Google)
      user = await this.userRepo.create({
        email,
        passwordHash: null,
        fullName,
        role: dto.role ?? UserRole.BIDDER,
        companyName: null,
        phone: null,
        avatarUrl,
        emailVerified: true,
        verificationToken: null,
        googleId,
      });
    }

    const token = this.tokenService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    return { user: toPublicUser(user), token };
  }
}
