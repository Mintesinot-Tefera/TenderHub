export type UserRole = 'ADMIN' | 'ORGANIZATION' | 'BIDDER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  companyName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export type TenderStatus = 'OPEN' | 'CLOSED' | 'AWARDED' | 'CANCELLED';

export interface Tender {
  id: string;
  title: string;
  description: string;
  referenceNumber: string;
  categoryId: string;
  organizationId: string;
  budgetMin: number | null;
  budgetMax: number | null;
  deadline: string;
  status: TenderStatus;
  location: string | null;
  requirements: string | null;
  createdAt: string;
  updatedAt: string;
  categoryName: string;
  categorySlug: string;
  organizationName: string;
  bidCount: number;
}

export interface PaginatedTenders {
  items: Tender[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TenderFilters {
  search?: string;
  categoryId?: string;
  status?: TenderStatus;
  page?: number;
  limit?: number;
}

export type BidStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Bid {
  id: string;
  tenderId: string;
  bidderId: string;
  amount: number;
  proposal: string;
  deliveryDays: number;
  documentUrl: string | null;
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BidWithTender extends Bid {
  tenderTitle: string;
  tenderReferenceNumber: string;
  tenderDeadline: string;
  tenderStatus: TenderStatus;
}

export const EDITABLE_BID_STATUSES: readonly BidStatus[] = ['SUBMITTED', 'UNDER_REVIEW'];

export interface Discussion {
  id: string;
  tenderId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatarUrl: string | null;
}

export interface DiscussionThread extends Discussion {
  replies: Discussion[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
