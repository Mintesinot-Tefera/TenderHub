import { UpdateProfile } from '../../../application/use-cases/auth/UpdateProfile';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserRole, User } from '../../../domain/entities/User';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'u1',
  email: 'user@test.com',
  passwordHash: 'hash',
  fullName: 'Old Name',
  role: UserRole.BIDDER,
  companyName: null,
  phone: null,
  avatarUrl: null,
  emailVerified: true,
  verificationToken: null,
  googleId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('UpdateProfile', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let useCase: UpdateProfile;

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
    useCase = new UpdateProfile(userRepo);
  });

  it('throws 404 when user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'missing', fullName: 'Name' })
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
  });

  it('updates profile and returns public user', async () => {
    const existing = makeUser();
    const updated = makeUser({ fullName: 'New Name', companyName: 'Acme' });
    userRepo.findById.mockResolvedValue(existing);
    userRepo.update.mockResolvedValue(updated);

    const result = await useCase.execute({
      userId: 'u1',
      fullName: 'New Name',
      companyName: 'Acme',
      phone: '+251911234567',
    });

    expect(userRepo.update).toHaveBeenCalledWith('u1', {
      fullName: 'New Name',
      companyName: 'Acme',
      phone: '+251911234567',
      avatarUrl: null,
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.fullName).toBe('New Name');
  });

  it('defaults optional fields to null', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    userRepo.update.mockResolvedValue(makeUser());

    await useCase.execute({ userId: 'u1', fullName: 'Name' });

    expect(userRepo.update).toHaveBeenCalledWith('u1', {
      fullName: 'Name',
      companyName: null,
      phone: null,
      avatarUrl: null,
    });
  });
});
