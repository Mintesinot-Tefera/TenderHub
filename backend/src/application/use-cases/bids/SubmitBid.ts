import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { Bid } from '../../../domain/entities/Bid';
import { TenderStatus } from '../../../domain/entities/Tender';
import { SubmitBidDTO } from '../../dtos/BidDTO';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../domain/errors/AppError';

export class SubmitBid {
  constructor(
    private readonly bidRepo: IBidRepository,
    private readonly tenderRepo: ITenderRepository
  ) {}

  async execute(dto: SubmitBidDTO): Promise<Bid> {
    const tender = await this.tenderRepo.findBasicById(dto.tenderId);
    if (!tender) {
      throw new NotFoundError('Tender');
    }

    if (tender.status !== TenderStatus.OPEN) {
      throw new ValidationError('Tender is not open for bidding');
    }

    if (tender.deadline < new Date()) {
      throw new ValidationError('Tender deadline has passed');
    }

    if (tender.organizationId === dto.bidderId) {
      throw new ValidationError('Cannot bid on your own tender');
    }

    const existing = await this.bidRepo.findByTenderAndBidder(
      dto.tenderId,
      dto.bidderId
    );
    if (existing && existing.status !== 'WITHDRAWN') {
      throw new ConflictError('You have already submitted a bid for this tender');
    }

    // Re-activate a previously withdrawn bid by updating it
    if (existing) {
      return this.bidRepo.update(existing.id, {
        amount: dto.amount,
        proposal: dto.proposal,
        deliveryDays: dto.deliveryDays,
        documentUrl: dto.documentUrl,
      });
    }

    return this.bidRepo.create({
      tenderId: dto.tenderId,
      bidderId: dto.bidderId,
      amount: dto.amount,
      proposal: dto.proposal,
      deliveryDays: dto.deliveryDays,
      documentUrl: dto.documentUrl,
    });
  }
}
