import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { BidWithBidder } from '../../../domain/entities/Bid';
import { NotFoundError, ForbiddenError } from '../../../domain/errors/AppError';

interface GetTenderBidsInput {
  tenderId: string;
  organizationId: string;
}

export class GetTenderBids {
  constructor(
    private readonly bidRepo: IBidRepository,
    private readonly tenderRepo: ITenderRepository
  ) {}

  async execute(input: GetTenderBidsInput): Promise<BidWithBidder[]> {
    const tender = await this.tenderRepo.findBasicById(input.tenderId);
    if (!tender) throw new NotFoundError('Tender');

    if (tender.organizationId !== input.organizationId) {
      throw new ForbiddenError('You can only view bids on your own tenders');
    }

    return this.bidRepo.findByTender(input.tenderId);
  }
}
