import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { TenderWithRelations } from '../../../domain/entities/Tender';
import { NotFoundError } from '../../../domain/errors/AppError';

export class GetTenderById {
  constructor(private readonly tenderRepo: ITenderRepository) {}

  async execute(id: string): Promise<TenderWithRelations> {
    const tender = await this.tenderRepo.findById(id);
    if (!tender) {
      throw new NotFoundError('Tender');
    }
    return tender;
  }
}
