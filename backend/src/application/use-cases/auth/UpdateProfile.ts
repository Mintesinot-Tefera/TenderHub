import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { PublicUser, toPublicUser } from '../../../domain/entities/User';
import { NotFoundError } from '../../../domain/errors/AppError';

interface UpdateProfileInput {
  userId: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  avatarUrl?: string;
}

export class UpdateProfile {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<PublicUser> {
    const existing = await this.userRepo.findById(input.userId);
    if (!existing) {
      throw new NotFoundError('User');
    }

    const updated = await this.userRepo.update(input.userId, {
      fullName: input.fullName,
      companyName: input.companyName ?? null,
      phone: input.phone ?? null,
      avatarUrl: input.avatarUrl ?? null,
    });

    return toPublicUser(updated);
  }
}
