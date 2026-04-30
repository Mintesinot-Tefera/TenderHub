import { WithdrawBid } from '../../../application/use-cases/bids/WithdrawBid';
import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { Bid, BidStatus } from '../../../domain/entities/Bid';

const makeBid = (overrides: Partial<Bid> = {}): Bid => ({
  id: 'b1',
  tenderId: 't1',
  bidderId: 'bidder1',
  amount: 1000,
  proposal: 'A proposal',
  deliveryDays: 30,
  documentUrl: null,
  status: BidStatus.SUBMITTED,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('WithdrawBid', () => {
  let bidRepo: jest.Mocked<IBidRepository>;
  let useCase: WithdrawBid;

  beforeEach(() => {
    bidRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTenderAndBidder: jest.fn(),
      findByBidder: jest.fn(),
      findByTender: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      withdraw: jest.fn(),
    };
    useCase = new WithdrawBid(bidRepo);
  });

  it('throws 404 when bid does not exist', async () => {
    bidRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ bidId: 'missing', bidderId: 'bidder1' })
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
  });

  it('throws 403 when not the bid owner', async () => {
    bidRepo.findById.mockResolvedValue(makeBid());

    await expect(
      useCase.execute({ bidId: 'b1', bidderId: 'other_user' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('throws 400 when bid is not in editable status', async () => {
    bidRepo.findById.mockResolvedValue(
      makeBid({ status: BidStatus.ACCEPTED })
    );

    await expect(
      useCase.execute({ bidId: 'b1', bidderId: 'bidder1' })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });

  it('withdraws bid successfully', async () => {
    bidRepo.findById.mockResolvedValue(makeBid());
    bidRepo.withdraw.mockResolvedValue(
      makeBid({ status: BidStatus.WITHDRAWN })
    );

    const result = await useCase.execute({ bidId: 'b1', bidderId: 'bidder1' });

    expect(bidRepo.withdraw).toHaveBeenCalledWith('b1');
    expect(result.status).toBe(BidStatus.WITHDRAWN);
  });

  it('allows withdrawal when status is UNDER_REVIEW', async () => {
    bidRepo.findById.mockResolvedValue(
      makeBid({ status: BidStatus.UNDER_REVIEW })
    );
    bidRepo.withdraw.mockResolvedValue(
      makeBid({ status: BidStatus.WITHDRAWN })
    );

    const result = await useCase.execute({ bidId: 'b1', bidderId: 'bidder1' });
    expect(result.status).toBe(BidStatus.WITHDRAWN);
  });
});
