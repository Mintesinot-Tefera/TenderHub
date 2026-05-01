import { LoginUser } from '../../../application/use-cases/auth/LoginUser';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../application/services/IPasswordHasher';
import { ITokenService } from '../../../application/services/ITokenService';
import { UserRole, User } from '../../../domain/entities/User';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'u1',
  email: 'user@test.com',
  passwordHash: 'hashed_pw',
  fullName: 'Test User',
  role: UserRole.BIDDER,
  companyName: null,
  phone: null,
  avatarUrl: null,
  emailVerified: true,
  verificationToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('LoginUser', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let hasher: jest.Mocked<IPasswordHasher>;
  let tokenService: jest.Mocked<ITokenService>;
  let useCase: LoginUser;

  beforeEach(() => {
    userRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByVerificationToken: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      verifyEmail: jest.fn(),
      setVerificationToken: jest.fn(),
    };
    hasher = { hash: jest.fn(), compare: jest.fn() };
    tokenService = { sign: jest.fn(), verify: jest.fn() };
    useCase = new LoginUser(userRepo, hasher, tokenService);
  });

  it('throws 401 when user not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'nonexistent@test.com', password: 'pw' })
    ).rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
  });

  it('throws 401 when password is wrong', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser());
    hasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'user@test.com', password: 'wrong' })
    ).rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
  });

  it('throws 403 when email is not verified', async () => {
    const user = makeUser({ emailVerified: false });
    userRepo.findByEmail.mockResolvedValue(user);
    hasher.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({ email: 'user@test.com', password: 'correct' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'EMAIL_NOT_VERIFIED' });
  });

  it('returns token and public user on success', async () => {
    const user = makeUser();
    userRepo.findByEmail.mockResolvedValue(user);
    hasher.compare.mockResolvedValue(true);
    tokenService.sign.mockReturnValue('jwt_token');

    const result = await useCase.execute({
      email: 'User@Test.Com',
      password: 'correct',
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('user@test.com');
    expect(hasher.compare).toHaveBeenCalledWith('correct', 'hashed_pw');
    expect(tokenService.sign).toHaveBeenCalledWith({
      userId: 'u1',
      email: 'user@test.com',
      role: UserRole.BIDDER,
    });
    expect(result.token).toBe('jwt_token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user.id).toBe('u1');
  });
});
