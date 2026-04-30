import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { TenderWithRelations } from '../../../domain/entities/Tender';

export class ListMyTenders {
  constructor(private readonly tenderRepo: ITenderRepository) {}

  async execute(organizationId: string): Promise<TenderWithRelations[]> {
    return this.tenderRepo.findByOrganization(organizationId);
  }
}
