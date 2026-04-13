import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { NotFoundError } from '../../../domain/errors/AppError';
import { PublicUser, toPublicUser } from '../../../domain/entities/User';

export class GetCurrentUser {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return toPublicUser(user);
  }
}
