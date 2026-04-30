import {
  Tender,
  TenderWithRelations,
  TenderFilters,
  PaginatedTenders,
  TenderStatus,
  CreateTenderProps,
  UpdateTenderProps,
} from '../entities/Tender';

export interface ITenderRepository {
  findAll(filters: TenderFilters): Promise<PaginatedTenders>;
  findById(id: string): Promise<TenderWithRelations | null>;
  findBasicById(id: string): Promise<Tender | null>;
  findByOrganization(organizationId: string): Promise<TenderWithRelations[]>;
  create(props: CreateTenderProps, referenceNumber: string): Promise<TenderWithRelations>;
  update(id: string, props: UpdateTenderProps): Promise<TenderWithRelations>;
  updateStatus(id: string, status: TenderStatus): Promise<Tender>;
}
