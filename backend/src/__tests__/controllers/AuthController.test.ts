import { Request, Response } from 'express';
import { AuthController } from '../../presentation/controllers/AuthController';
import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { GetCurrentUser } from '../../application/use-cases/auth/GetCurrentUser';
import { UpdateProfile } from '../../application/use-cases/auth/UpdateProfile';
import { VerifyEmail } from '../../application/use-cases/auth/VerifyEmail';
import { ResendVerification } from '../../application/use-cases/auth/ResendVerification';
import { GoogleAuthUser } from '../../application/use-cases/auth/GoogleAuthUser';
import { UserRole } from '../../domain/entities/User';

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('AuthController', () => {
  let registerUser: jest.Mocked<RegisterUser>;
  let loginUser: jest.Mocked<LoginUser>;
  let getCurrentUser: jest.Mocked<GetCurrentUser>;
  let updateProfile: jest.Mocked<UpdateProfile>;
  let verifyEmail: jest.Mocked<VerifyEmail>;
  let resendVerification: jest.Mocked<ResendVerification>;
  let googleAuthUser: jest.Mocked<GoogleAuthUser>;
  let controller: AuthController;

  beforeEach(() => {
    registerUser = { execute: jest.fn() } as any;
    loginUser = { execute: jest.fn() } as any;
    getCurrentUser = { execute: jest.fn() } as any;
    updateProfile = { execute: jest.fn() } as any;
    verifyEmail = { execute: jest.fn() } as any;
    resendVerification = { execute: jest.fn() } as any;
    googleAuthUser = { execute: jest.fn() } as any;
    controller = new AuthController(registerUser, loginUser, getCurrentUser, updateProfile, verifyEmail, resendVerification, googleAuthUser);
  });

  describe('register', () => {
    it('returns 201 with message', async () => {
      const result = { message: 'Registration successful. Please check your email to verify your account.' };
      registerUser.execute.mockResolvedValue(result as any);

      const req = {
        body: {
          email: 'test@test.com',
          password: 'password123',
          fullName: 'Test',
          role: UserRole.BIDDER,
        },
      } as Request;
      const res = mockRes();

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });

  describe('login', () => {
    it('returns 200 with auth result', async () => {
      const authResult = {
        user: { id: 'u1', email: 'test@test.com' },
        token: 'jwt',
      };
      loginUser.execute.mockResolvedValue(authResult as any);

      const req = {
        body: { email: 'test@test.com', password: 'password123' },
      } as Request;
      const res = mockRes();

      await controller.login(req, res);

      expect(res.json).toHaveBeenCalledWith(authResult);
    });
  });

  describe('me', () => {
    it('returns current user', async () => {
      const publicUser = { id: 'u1', email: 'test@test.com', fullName: 'Test' };
      getCurrentUser.execute.mockResolvedValue(publicUser as any);

      const req = { user: { userId: 'u1' } } as unknown as Request;
      const res = mockRes();

      await controller.me(req, res);

      expect(getCurrentUser.execute).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(publicUser);
    });
  });

  describe('updateProfile', () => {
    it('returns updated user', async () => {
      const updated = { id: 'u1', fullName: 'New Name' };
      updateProfile.execute.mockResolvedValue(updated as any);

      const req = {
        user: { userId: 'u1' },
        body: { fullName: 'New Name' },
      } as unknown as Request;
      const res = mockRes();

      await controller.updateProfile(req, res);

      expect(updateProfile.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', fullName: 'New Name' })
      );
      expect(res.json).toHaveBeenCalledWith(updated);
    });
  });
});
