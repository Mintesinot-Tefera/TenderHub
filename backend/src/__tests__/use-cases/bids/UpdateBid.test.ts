import { UpdateBid } from '../../../application/use-cases/bids/UpdateBid';
import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { Bid, BidStatus } from '../../../domain/entities/Bid';
import { Tender, TenderStatus } from '../../../domain/entities/Tender';

const futureDateMs = Date.now() + 7 * 24 * 3600 * 1000;

const makeTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: 't1',
  title: 'Test',
  description: 'Desc',
  referenceNumber: 'REF-001',
  categoryId: 'c1',
  organizationId: 'org1',
  budgetMin: null,
  budgetMax: null,
  deadline: new Date(futureDateMs),
  status: TenderStatus.OPEN,
  location: null,
  requirements: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeBid = (overrides: Partial<Bid> = {}): Bid => ({
  id: 'b1',
  tenderId: 't1',
  bidderId: 'bidder1',
  amount: 1000,
  proposal: 'A proposal text that is long enough',
  deliveryDays: 30,
  documentUrl: null,
  status: BidStatus.SUBMITTED,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('UpdateBid', () => {
  let bidRepo: jest.Mocked<IBidRepository>;
  let tenderRepo: jest.Mocked<ITenderRepository>;
  let useCase: UpdateBid;

  const input = {
    bidId: 'b1',
    bidderId: 'bidder1',
    amount: 2000,
    proposal: 'Updated proposal text long enough',
    deliveryDays: 15,
  };

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
    tenderRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBasicById: jest.fn(),
      findByOrganization: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };
    useCase = new UpdateBid(bidRepo, tenderRepo);
  });

  it('throws 404 when bid not found', async () => {
    bidRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws 403 when not the bid owner', async () => {
    bidRepo.findById.mockResolvedValue(makeBid({ bidderId: 'other_user' }));

    await expect(useCase.execute(input)).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('throws 400 when bid status is not editable (ACCEPTED)', async () => {
    bidRepo.findById.mockResolvedValue(
      makeBid({ status: BidStatus.ACCEPTED })
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws 400 when bid status is REJECTED', async () => {
    bidRepo.findById.mockResolvedValue(
      makeBid({ status: BidStatus.REJECTED })
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws 400 when tender is no longer open', async () => {
    bidRepo.findById.mockResolvedValue(makeBid());
    tenderRepo.findBasicById.mockResolvedValue(
      makeTender({ status: TenderStatus.CLOSED })
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws 400 when tender deadline has passed', async () => {
    bidRepo.findById.mockResolvedValue(makeBid());
    tenderRepo.findBasicById.mockResolvedValue(
      makeTender({ deadline: new Date('2020-01-01') })
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('updates bid successfully', async () => {
    bidRepo.findById.mockResolvedValue(makeBid());
    tenderRepo.findBasicById.mockResolvedValue(makeTender());
    bidRepo.update.mockResolvedValue(makeBid({ amount: 2000 }));

    const result = await useCase.execute(input);

    expect(bidRepo.update).toHaveBeenCalledWith('b1', {
      amount: 2000,
      proposal: input.proposal,
      deliveryDays: 15,
      documentUrl: undefined,
    });
    expect(result.amount).toBe(2000);
  });

  it('allows update when bid status is UNDER_REVIEW', async () => {
    bidRepo.findById.mockResolvedValue(
      makeBid({ status: BidStatus.UNDER_REVIEW })
    );
    tenderRepo.findBasicById.mockResolvedValue(makeTender());
    bidRepo.update.mockResolvedValue(makeBid());

    await expect(useCase.execute(input)).resolves.toBeDefined();
  });
});
