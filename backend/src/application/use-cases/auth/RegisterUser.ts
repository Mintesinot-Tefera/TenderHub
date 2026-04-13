import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../services/IPasswordHasher';
import { ITokenService } from '../../services/ITokenService';
import { RegisterDTO, AuthResultDTO } from '../../dtos/AuthDTO';
import { ConflictError, ValidationError } from '../../../domain/errors/AppError';
import { UserRole, toPublicUser } from '../../../domain/entities/User';

export class RegisterUser {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async execute(dto: RegisterDTO): Promise<AuthResultDTO> {
    if (dto.role === UserRole.ADMIN) {
      throw new ValidationError('Cannot self-register as admin');
    }

    const existing = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await this.hasher.hash(dto.password);

    const user = await this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      role: dto.role,
      companyName: dto.companyName ?? null,
      phone: dto.phone ?? null,
      avatarUrl: null,
    });

    const token = this.tokenService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: toPublicUser(user), token };
  }
}
