import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../services/IPasswordHasher';
import { ITokenService } from '../../services/ITokenService';
import { LoginDTO, AuthResultDTO } from '../../dtos/AuthDTO';
import { UnauthorizedError, EmailNotVerifiedError } from '../../../domain/errors/AppError';
import { toPublicUser } from '../../../domain/entities/User';

export class LoginUser {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async execute(dto: LoginDTO): Promise<AuthResultDTO> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('This account uses Google Sign-In. Please sign in with Google.');
    }

    const valid = await this.hasher.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    const token = this.tokenService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: toPublicUser(user), token };
  }
}
