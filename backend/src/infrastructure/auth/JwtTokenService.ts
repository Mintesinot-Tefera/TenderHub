import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../../application/services/ITokenService';
import { UnauthorizedError } from '../../domain/errors/AppError';
import { env } from '../../config/env';

export class JwtTokenService implements ITokenService {
  sign(payload: TokenPayload): string {
    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  verify(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.jwtSecret) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
