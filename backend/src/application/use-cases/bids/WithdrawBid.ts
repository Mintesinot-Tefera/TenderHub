import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { Bid, EDITABLE_BID_STATUSES } from '../../../domain/entities/Bid';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../domain/errors/AppError';

interface WithdrawBidInput {
  bidId: string;
  bidderId: string;
}

export class WithdrawBid {
  constructor(private readonly bidRepo: IBidRepository) {}

  async execute(input: WithdrawBidInput): Promise<Bid> {
    const bid = await this.bidRepo.findById(input.bidId);
    if (!bid) {
      throw new NotFoundError('Bid');
    }

    if (bid.bidderId !== input.bidderId) {
      throw new ForbiddenError('You can only withdraw your own bids');
    }

    if (!EDITABLE_BID_STATUSES.includes(bid.status)) {
      throw new ValidationError(
        `Cannot withdraw a bid with status ${bid.status}`
      );
    }

    return this.bidRepo.withdraw(input.bidId);
  }
}
