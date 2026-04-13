import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { Bid, EDITABLE_BID_STATUSES } from '../../../domain/entities/Bid';
import { TenderStatus } from '../../../domain/entities/Tender';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../domain/errors/AppError';

interface UpdateBidInput {
  bidId: string;
  bidderId: string;
  amount: number;
  proposal: string;
  deliveryDays: number;
  documentUrl?: string | null;
}

export class UpdateBid {
  constructor(
    private readonly bidRepo: IBidRepository,
    private readonly tenderRepo: ITenderRepository
  ) {}

  async execute(input: UpdateBidInput): Promise<Bid> {
    const bid = await this.bidRepo.findById(input.bidId);
    if (!bid) {
      throw new NotFoundError('Bid');
    }

    if (bid.bidderId !== input.bidderId) {
      throw new ForbiddenError('You can only edit your own bids');
    }

    if (!EDITABLE_BID_STATUSES.includes(bid.status)) {
      throw new ValidationError(
        `Cannot edit a bid with status ${bid.status}`
      );
    }

    const tender = await this.tenderRepo.findBasicById(bid.tenderId);
    if (!tender || tender.status !== TenderStatus.OPEN) {
      throw new ValidationError('Tender is no longer open for bidding');
    }
    if (tender.deadline < new Date()) {
      throw new ValidationError('Tender deadline has passed');
    }

    return this.bidRepo.update(input.bidId, {
      amount: input.amount,
      proposal: input.proposal,
      deliveryDays: input.deliveryDays,
      documentUrl: input.documentUrl,
    });
  }
}
