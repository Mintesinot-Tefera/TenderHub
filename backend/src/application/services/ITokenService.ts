import { UserRole } from '../../domain/entities/User';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ITokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
