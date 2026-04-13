import { Request, Response, NextFunction } from 'express';
import { ITokenService, TokenPayload } from '../../application/services/ITokenService';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors/AppError';
import { UserRole } from '../../domain/entities/User';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}

export const createAuthMiddleware = (tokenService: ITokenService) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing authentication token'));
    }

    const token = header.slice(7);
    const payload = tokenService.verify(token);
    req.user = payload;
    next();
  };
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
};
