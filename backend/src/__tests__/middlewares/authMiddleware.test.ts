import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware, requireRole } from '../../presentation/middlewares/authMiddleware';
import { ITokenService, TokenPayload } from '../../application/services/ITokenService';
import { UserRole } from '../../domain/entities/User';

const mockReq = (headers: Record<string, string> = {}, user?: TokenPayload) => {
  const req = { headers, user } as unknown as Request;
  return req;
};

const mockRes = () => ({} as Response);

describe('createAuthMiddleware', () => {
  let tokenService: jest.Mocked<ITokenService>;
  let middleware: ReturnType<typeof createAuthMiddleware>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    tokenService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    middleware = createAuthMiddleware(tokenService);
    next = jest.fn();
  });

  it('calls next with error when no Authorization header', () => {
    const req = mockReq();

    middleware(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: 'UNAUTHORIZED' })
    );
  });

  it('calls next with error when header does not start with Bearer', () => {
    const req = mockReq({ authorization: 'Basic abc123' });

    middleware(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: 'UNAUTHORIZED' })
    );
  });

  it('propagates error when token verification fails', () => {
    tokenService.verify.mockImplementation(() => {
      throw Object.assign(new Error('Invalid token'), {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    });
    const req = mockReq({ authorization: 'Bearer bad_token' });

    expect(() => middleware(req, mockRes(), next)).toThrow('Invalid token');
  });

  it('attaches user payload and calls next on valid token', () => {
    const payload: TokenPayload = {
      userId: 'u1',
      email: 'user@test.com',
      role: UserRole.BIDDER,
    };
    tokenService.verify.mockReturnValue(payload);
    const req = mockReq({ authorization: 'Bearer valid_token' });

    middleware(req, mockRes(), next);

    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('requireRole', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next with error when req.user is missing', () => {
    const middleware = requireRole(UserRole.BIDDER);
    const req = mockReq();

    middleware(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('calls next with error when role does not match', () => {
    const middleware = requireRole(UserRole.BIDDER);
    const req = mockReq({}, {
      userId: 'u1',
      email: 'org@test.com',
      role: UserRole.ORGANIZATION,
    });

    middleware(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' })
    );
  });

  it('calls next() when role matches', () => {
    const middleware = requireRole(UserRole.BIDDER);
    const req = mockReq({}, {
      userId: 'u1',
      email: 'bidder@test.com',
      role: UserRole.BIDDER,
    });

    middleware(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('accepts multiple roles', () => {
    const middleware = requireRole(UserRole.ADMIN, UserRole.ORGANIZATION);
    const req = mockReq({}, {
      userId: 'u1',
      email: 'org@test.com',
      role: UserRole.ORGANIZATION,
    });

    middleware(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });
});
