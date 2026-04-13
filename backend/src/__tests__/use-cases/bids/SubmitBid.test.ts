import { SubmitBid } from '../../../application/use-cases/bids/SubmitBid';
import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { Bid, BidStatus } from '../../../domain/entities/Bid';
import { Tender, TenderStatus } from '../../../domain/entities/Tender';

const futureDateMs = Date.now() + 7 * 24 * 3600 * 1000;

const makeTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: 't1',
  title: 'Test Tender',
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

describe('SubmitBid', () => {
  let bidRepo: jest.Mocked<IBidRepository>;
  let tenderRepo: jest.Mocked<ITenderRepository>;
  let useCase: SubmitBid;

  const dto = {
    tenderId: 't1',
    bidderId: 'bidder1',
    amount: 5000,
    proposal: 'A proposal that is long enough for validation',
    deliveryDays: 30,
  };

  beforeEach(() => {
    bidRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTenderAndBidder: jest.fn(),
      findByBidder: jest.fn(),
      update: jest.fn(),
      withdraw: jest.fn(),
    };
    tenderRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBasicById: jest.fn(),
    };
    useCase = new SubmitBid(bidRepo, tenderRepo);
  });

  it('throws 404 when tender does not exist', async () => {
    tenderRepo.findBasicById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws 400 when tender is not OPEN', async () => {
    tenderRepo.findBasicById.mockResolvedValue(
      makeTender({ status: TenderStatus.CLOSED })
    );

    await expect(useCase.execute(dto)).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws 400 when deadline has passed', async () => {
    tenderRepo.findBasicById.mockResolvedValue(
      makeTender({ deadline: new Date('2020-01-01') })
    );

    await expect(useCase.execute(dto)).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws 400 when bidding on own tender', async () => {
    tenderRepo.findBasicById.mockResolvedValue(
      makeTender({ organizationId: 'bidder1' })
    );

    await expect(useCase.execute(dto)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Cannot bid on your own tender',
    });
  });

  it('throws 409 when active bid already exists', async () => {
    tenderRepo.findBasicById.mockResolvedValue(makeTender());
    bidRepo.findByTenderAndBidder.mockResolvedValue(
      makeBid({ status: BidStatus.SUBMITTED })
    );

    await expect(useCase.execute(dto)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('re-activates a withdrawn bid via update', async () => {
    tenderRepo.findBasicById.mockResolvedValue(makeTender());
    bidRepo.findByTenderAndBidder.mockResolvedValue(
      makeBid({ id: 'existing_bid', status: BidStatus.WITHDRAWN })
    );
    bidRepo.update.mockResolvedValue(makeBid({ id: 'existing_bid' }));

    const result = await useCase.execute(dto);

    expect(bidRepo.update).toHaveBeenCalledWith('existing_bid', {
      amount: 5000,
      proposal: dto.proposal,
      deliveryDays: 30,
      documentUrl: undefined,
    });
    expect(bidRepo.create).not.toHaveBeenCalled();
    expect(result.id).toBe('existing_bid');
  });

  it('creates a new bid when none exists', async () => {
    tenderRepo.findBasicById.mockResolvedValue(makeTender());
    bidRepo.findByTenderAndBidder.mockResolvedValue(null);
    bidRepo.create.mockResolvedValue(makeBid());

    const result = await useCase.execute(dto);

    expect(bidRepo.create).toHaveBeenCalledWith({
      tenderId: 't1',
      bidderId: 'bidder1',
      amount: 5000,
      proposal: dto.proposal,
      deliveryDays: 30,
      documentUrl: undefined,
    });
    expect(result.id).toBe('b1');
  });

  it('passes documentUrl when provided', async () => {
    tenderRepo.findBasicById.mockResolvedValue(makeTender());
    bidRepo.findByTenderAndBidder.mockResolvedValue(null);
    bidRepo.create.mockResolvedValue(makeBid({ documentUrl: '/uploads/proposals/test.pdf' }));

    await useCase.execute({ ...dto, documentUrl: '/uploads/proposals/test.pdf' });

    expect(bidRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ documentUrl: '/uploads/proposals/test.pdf' })
    );
  });
});
