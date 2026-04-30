import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { Tender, TenderStatus } from '../../../domain/entities/Tender';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../domain/errors/AppError';

export type TenderStatusAction = 'close' | 'cancel';

interface UpdateTenderStatusInput {
  tenderId: string;
  organizationId: string;
  action: TenderStatusAction;
}

const ALLOWED_FROM: Record<TenderStatusAction, TenderStatus[]> = {
  close: [TenderStatus.OPEN],
  cancel: [TenderStatus.OPEN, TenderStatus.CLOSED],
};

const TARGET_STATUS: Record<TenderStatusAction, TenderStatus> = {
  close: TenderStatus.CLOSED,
  cancel: TenderStatus.CANCELLED,
};

export class UpdateTenderStatus {
  constructor(private readonly tenderRepo: ITenderRepository) {}

  async execute(input: UpdateTenderStatusInput): Promise<Tender> {
    const tender = await this.tenderRepo.findBasicById(input.tenderId);
    if (!tender) throw new NotFoundError('Tender');

    if (tender.organizationId !== input.organizationId) {
      throw new ForbiddenError('You can only manage your own tenders');
    }

    if (!ALLOWED_FROM[input.action].includes(tender.status)) {
      throw new ValidationError(
        `Cannot ${input.action} a tender with status ${tender.status}`
      );
    }

    return this.tenderRepo.updateStatus(input.tenderId, TARGET_STATUS[input.action]);
  }
}
