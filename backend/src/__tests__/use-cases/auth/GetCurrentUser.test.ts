import { GetCurrentUser } from '../../../application/use-cases/auth/GetCurrentUser';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserRole, User } from '../../../domain/entities/User';

const makeUser = (): User => ({
  id: 'u1',
  email: 'user@test.com',
  passwordHash: 'hash',
  fullName: 'Test',
  role: UserRole.BIDDER,
  companyName: null,
  phone: null,
  avatarUrl: null,
  emailVerified: true,
  verificationToken: null,
  googleId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('GetCurrentUser', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let useCase: GetCurrentUser;

  beforeEach(() => {
    userRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByVerificationToken: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      verifyEmail: jest.fn(),
      setVerificationToken: jest.fn(),
      findByGoogleId: jest.fn(),
      linkGoogleId: jest.fn(),
      findByResetToken: jest.fn(),
      setResetToken: jest.fn(),
      clearResetToken: jest.fn(),
      setPassword: jest.fn(),
    };
    useCase = new GetCurrentUser(userRepo);
  });

  it('returns public user when found', async () => {
    userRepo.findById.mockResolvedValue(makeUser());

    const result = await useCase.execute('u1');

    expect(userRepo.findById).toHaveBeenCalledWith('u1');
    expect(result.id).toBe('u1');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('throws 404 when user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});
