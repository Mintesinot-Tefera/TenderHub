import { UserRole, toPublicUser, User } from '../../domain/entities/User';
import { TenderStatus } from '../../domain/entities/Tender';
import { BidStatus, EDITABLE_BID_STATUSES } from '../../domain/entities/Bid';

describe('User entity', () => {
  const user: User = {
    id: 'u1',
    email: 'test@example.com',
    passwordHash: 'secret_hash',
    fullName: 'Test User',
    role: UserRole.BIDDER,
    companyName: null,
    phone: null,
    avatarUrl: null,
    emailVerified: true,
    verificationToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('toPublicUser strips passwordHash', () => {
    const pub = toPublicUser(user);
    expect(pub).not.toHaveProperty('passwordHash');
    expect(pub.id).toBe('u1');
    expect(pub.email).toBe('test@example.com');
    expect(pub.fullName).toBe('Test User');
    expect(pub.role).toBe(UserRole.BIDDER);
  });

  it('UserRole enum has correct values', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.ORGANIZATION).toBe('ORGANIZATION');
    expect(UserRole.BIDDER).toBe('BIDDER');
  });
});

describe('Tender entity', () => {
  it('TenderStatus enum has correct values', () => {
    expect(TenderStatus.OPEN).toBe('OPEN');
    expect(TenderStatus.CLOSED).toBe('CLOSED');
    expect(TenderStatus.AWARDED).toBe('AWARDED');
    expect(TenderStatus.CANCELLED).toBe('CANCELLED');
  });
});

describe('Bid entity', () => {
  it('BidStatus enum has correct values', () => {
    expect(BidStatus.SUBMITTED).toBe('SUBMITTED');
    expect(BidStatus.UNDER_REVIEW).toBe('UNDER_REVIEW');
    expect(BidStatus.ACCEPTED).toBe('ACCEPTED');
    expect(BidStatus.REJECTED).toBe('REJECTED');
    expect(BidStatus.WITHDRAWN).toBe('WITHDRAWN');
  });

  it('EDITABLE_BID_STATUSES includes only SUBMITTED and UNDER_REVIEW', () => {
    expect(EDITABLE_BID_STATUSES).toEqual([BidStatus.SUBMITTED, BidStatus.UNDER_REVIEW]);
    expect(EDITABLE_BID_STATUSES).not.toContain(BidStatus.ACCEPTED);
    expect(EDITABLE_BID_STATUSES).not.toContain(BidStatus.REJECTED);
    expect(EDITABLE_BID_STATUSES).not.toContain(BidStatus.WITHDRAWN);
  });
});
