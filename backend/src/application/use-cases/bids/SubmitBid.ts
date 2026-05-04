import { IBidRepository } from '../../../domain/repositories/IBidRepository';
import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEmailService } from '../../services/IEmailService';
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
    private readonly tenderRepo: ITenderRepository,
    private readonly userRepo: IUserRepository,
    private readonly emailService: IEmailService
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

    let bid: Bid;

    // Re-activate a previously withdrawn bid by updating it
    if (existing) {
      bid = await this.bidRepo.update(existing.id, {
        amount: dto.amount,
        proposal: dto.proposal,
        deliveryDays: dto.deliveryDays,
        documentUrl: dto.documentUrl,
      });
    } else {
      bid = await this.bidRepo.create({
        tenderId: dto.tenderId,
        bidderId: dto.bidderId,
        amount: dto.amount,
        proposal: dto.proposal,
        deliveryDays: dto.deliveryDays,
        documentUrl: dto.documentUrl,
      });
    }

    // Notify the organization of the new bid (fire-and-forget)
    this.userRepo.findById(tender.organizationId)
      .then(org => {
        if (org) {
          this.emailService
            .sendBidSubmittedEmail(org.email, tender.title, tender.referenceNumber)
            .catch(err => console.error('Failed to send bid submitted email:', err));
        }
      })
      .catch(err => console.error('Failed to look up org for bid notification:', err));

    return bid;
  }
}
