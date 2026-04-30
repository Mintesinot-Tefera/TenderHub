import { GetMyBids } from '../../../application/use-cases/bids/GetMyBids';
import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { BidStatus, BidWithTender } from '../../../domain/entities/Bid';

describe('GetMyBids', () => {
  let bidRepo: jest.Mocked<IBidRepository>;
  let useCase: GetMyBids;

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
    useCase = new GetMyBids(bidRepo);
  });

  it('delegates to bidRepo.findByBidder', async () => {
    const bids: BidWithTender[] = [
      {
        id: 'b1',
        tenderId: 't1',
        bidderId: 'bidder1',
        amount: 1000,
        proposal: 'Test',
        deliveryDays: 30,
        documentUrl: null,
        status: BidStatus.SUBMITTED,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenderTitle: 'Tender 1',
        tenderReferenceNumber: 'REF-001',
        tenderDeadline: new Date(),
        tenderStatus: 'OPEN',
      },
    ];
    bidRepo.findByBidder.mockResolvedValue(bids);

    const result = await useCase.execute('bidder1');

    expect(bidRepo.findByBidder).toHaveBeenCalledWith('bidder1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b1');
  });
});
