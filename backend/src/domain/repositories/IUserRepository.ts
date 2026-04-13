import { User, CreateUserProps, UpdateUserProps } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(props: CreateUserProps): Promise<User>;
  update(id: string, props: UpdateUserProps): Promise<User>;
}
