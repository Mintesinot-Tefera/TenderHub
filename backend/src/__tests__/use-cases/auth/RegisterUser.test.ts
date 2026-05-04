import { RegisterUser } from '../../../application/use-cases/auth/RegisterUser';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../application/services/IPasswordHasher';
import { IEmailService } from '../../../application/services/IEmailService';
import { UserRole, User } from '../../../domain/entities/User';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'u1',
  email: 'test@example.com',
  passwordHash: 'hashed',
  fullName: 'Test User',
  role: UserRole.BIDDER,
  companyName: null,
  phone: null,
  avatarUrl: null,
  emailVerified: false,
  verificationToken: 'some-token',
  googleId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('RegisterUser', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let hasher: jest.Mocked<IPasswordHasher>;
  let emailService: jest.Mocked<IEmailService>;
  let useCase: RegisterUser;

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
    hasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    emailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendBidSubmittedEmail: jest.fn(),
      sendBidReviewedEmail: jest.fn(),
    };
    useCase = new RegisterUser(userRepo, hasher, emailService);
  });

  it('rejects admin self-registration', async () => {
    await expect(
      useCase.execute({
        email: 'admin@test.com',
        password: 'password123',
        fullName: 'Admin',
        role: UserRole.ADMIN,
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });

  it('rejects duplicate email', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser());

    await expect(
      useCase.execute({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test',
        role: UserRole.BIDDER,
      })
    ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });

  it('registers a new user successfully', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    hasher.hash.mockResolvedValue('hashed_pw');
    const createdUser = makeUser({ email: 'new@example.com' });
    userRepo.create.mockResolvedValue(createdUser);
    emailService.sendVerificationEmail.mockResolvedValue();

    const result = await useCase.execute({
      email: 'New@Example.com',
      password: 'password123',
      fullName: 'New User',
      role: UserRole.BIDDER,
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('new@example.com');
    expect(hasher.hash).toHaveBeenCalledWith('password123');
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        passwordHash: 'hashed_pw',
        role: UserRole.BIDDER,
      })
    );
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      'new@example.com',
      expect.any(String)
    );
    expect(result.message).toBeDefined();
  });

  it('normalizes email to lowercase', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    hasher.hash.mockResolvedValue('hashed');
    userRepo.create.mockResolvedValue(makeUser());
    emailService.sendVerificationEmail.mockResolvedValue();

    await useCase.execute({
      email: 'UPPER@TEST.COM',
      password: 'password123',
      fullName: 'User',
      role: UserRole.ORGANIZATION,
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('upper@test.com');
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'upper@test.com' })
    );
  });

  it('passes optional companyName and phone to create', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    hasher.hash.mockResolvedValue('hashed');
    userRepo.create.mockResolvedValue(makeUser());
    emailService.sendVerificationEmail.mockResolvedValue();

    await useCase.execute({
      email: 'org@test.com',
      password: 'password123',
      fullName: 'Org User',
      role: UserRole.ORGANIZATION,
      companyName: 'Acme Corp',
      phone: '+251911234567',
    });

    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: 'Acme Corp',
        phone: '+251911234567',
      })
    );
  });
});
