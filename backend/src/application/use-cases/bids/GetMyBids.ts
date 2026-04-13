import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { BidWithTender } from '../../../domain/entities/Bid';

export class GetMyBids {
  constructor(private readonly bidRepo: IBidRepository) {}

  async execute(bidderId: string): Promise<BidWithTender[]> {
    return this.bidRepo.findByBidder(bidderId);
  }
}
