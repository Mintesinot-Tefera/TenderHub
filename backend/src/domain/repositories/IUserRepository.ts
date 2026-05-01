import { User, CreateUserProps, UpdateUserProps } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByVerificationToken(token: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(props: CreateUserProps): Promise<User>;
  update(id: string, props: UpdateUserProps): Promise<User>;
  verifyEmail(userId: string): Promise<void>;
  setVerificationToken(userId: string, token: string): Promise<void>;
  linkGoogleId(userId: string, googleId: string): Promise<void>;
}
