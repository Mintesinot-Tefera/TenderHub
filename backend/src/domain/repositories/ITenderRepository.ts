import { Tender, TenderWithRelations, TenderFilters, PaginatedTenders } from '../entities/Tender';

export interface ITenderRepository {
  findAll(filters: TenderFilters): Promise<PaginatedTenders>;
  findById(id: string): Promise<TenderWithRelations | null>;
  findBasicById(id: string): Promise<Tender | null>;
}
