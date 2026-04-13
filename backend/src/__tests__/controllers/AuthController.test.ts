import { Request, Response } from 'express';
import { AuthController } from '../../presentation/controllers/AuthController';
import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { GetCurrentUser } from '../../application/use-cases/auth/GetCurrentUser';
import { UpdateProfile } from '../../application/use-cases/auth/UpdateProfile';
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
  let controller: AuthController;

  beforeEach(() => {
    registerUser = { execute: jest.fn() } as any;
    loginUser = { execute: jest.fn() } as any;
    getCurrentUser = { execute: jest.fn() } as any;
    updateProfile = { execute: jest.fn() } as any;
    controller = new AuthController(registerUser, loginUser, getCurrentUser, updateProfile);
  });

  describe('register', () => {
    it('returns 201 with auth result', async () => {
      const authResult = {
        user: { id: 'u1', email: 'test@test.com', fullName: 'Test', role: UserRole.BIDDER },
        token: 'jwt',
      };
      registerUser.execute.mockResolvedValue(authResult as any);

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
      expect(res.json).toHaveBeenCalledWith(authResult);
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
