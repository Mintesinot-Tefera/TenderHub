import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../application/services/IPasswordHasher';

export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly rounds = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
