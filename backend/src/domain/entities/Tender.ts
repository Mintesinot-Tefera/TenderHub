export enum TenderStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  AWARDED = 'AWARDED',
  CANCELLED = 'CANCELLED',
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  referenceNumber: string;
  categoryId: string;
  organizationId: string;
  budgetMin: number | null;
  budgetMax: number | null;
  deadline: Date;
  status: TenderStatus;
  location: string | null;
  requirements: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenderWithRelations extends Tender {
  categoryName: string;
  categorySlug: string;
  organizationName: string;
  bidCount: number;
}

export interface TenderFilters {
  search?: string;
  categoryId?: string;
  status?: TenderStatus;
  page: number;
  limit: number;
}

export interface PaginatedTenders {
  items: TenderWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
