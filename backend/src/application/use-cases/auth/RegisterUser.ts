import crypto from 'crypto';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../services/IPasswordHasher';
import { IEmailService } from '../../services/IEmailService';
import { RegisterDTO } from '../../dtos/AuthDTO';
import { ConflictError, ValidationError } from '../../../domain/errors/AppError';
import { UserRole } from '../../../domain/entities/User';

export class RegisterUser {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly emailService: IEmailService
  ) {}

  async execute(dto: RegisterDTO): Promise<{ message: string }> {
    if (dto.role === UserRole.ADMIN) {
      throw new ValidationError('Cannot self-register as admin');
    }

    const existing = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await this.hasher.hash(dto.password);
    const verificationToken = crypto.randomUUID();

    await this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      role: dto.role,
      companyName: dto.companyName ?? null,
      phone: dto.phone ?? null,
      avatarUrl: null,
      emailVerified: false,
      verificationToken,
      googleId: null,
    });

    // Fire-and-forget — SMTP failures must not block account creation.
    // The user can request a resend from the login page if the email doesn't arrive.
    this.emailService.sendVerificationEmail(dto.email.toLowerCase(), verificationToken)
      .catch((err) => console.error('[RegisterUser] Failed to send verification email:', err));

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }
}
