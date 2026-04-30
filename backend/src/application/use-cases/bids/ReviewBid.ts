import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { Bid, BidStatus } from '../../../domain/entities/Bid';
import { TenderStatus } from '../../../domain/entities/Tender';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../domain/errors/AppError';

export type ReviewAction = 'under_review' | 'accept' | 'reject';

interface ReviewBidInput {
  bidId: string;
  organizationId: string;
  action: ReviewAction;
}

const STATUS_MAP: Record<ReviewAction, BidStatus> = {
  under_review: BidStatus.UNDER_REVIEW,
  accept: BidStatus.ACCEPTED,
  reject: BidStatus.REJECTED,
};

export class ReviewBid {
  constructor(
    private readonly bidRepo: IBidRepository,
    private readonly tenderRepo: ITenderRepository
  ) {}

  async execute(input: ReviewBidInput): Promise<Bid> {
    const bid = await this.bidRepo.findById(input.bidId);
    if (!bid) throw new NotFoundError('Bid');

    const tender = await this.tenderRepo.findBasicById(bid.tenderId);
    if (!tender) throw new NotFoundError('Tender');

    if (tender.organizationId !== input.organizationId) {
      throw new ForbiddenError('You can only review bids on your own tenders');
    }

    if (bid.status === BidStatus.WITHDRAWN) {
      throw new ValidationError('Cannot review a withdrawn bid');
    }

    if (input.action === 'accept' && tender.status === TenderStatus.AWARDED) {
      throw new ValidationError('This tender has already been awarded');
    }

    const updatedBid = await this.bidRepo.updateStatus(bid.id, STATUS_MAP[input.action]);

    // Awarding a bid closes the tender to further bids
    if (input.action === 'accept') {
      await this.tenderRepo.updateStatus(tender.id, TenderStatus.AWARDED);
    }

    return updatedBid;
  }
}
