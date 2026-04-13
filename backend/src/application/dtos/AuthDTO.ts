import { UserRole, PublicUser } from '../../domain/entities/User';

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  companyName?: string;
  phone?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResultDTO {
  user: PublicUser;
  token: string;
}
