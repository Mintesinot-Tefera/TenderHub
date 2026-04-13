import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { TenderFilters, PaginatedTenders } from '../../../domain/entities/Tender';

export class ListTenders {
  constructor(private readonly tenderRepo: ITenderRepository) {}

  async execute(filters: TenderFilters): Promise<PaginatedTenders> {
    return this.tenderRepo.findAll(filters);
  }
}
