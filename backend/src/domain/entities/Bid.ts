export enum BidStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface Bid {
  id: string;
  tenderId: string;
  bidderId: string;
  amount: number;
  proposal: string;
  deliveryDays: number;
  documentUrl: string | null;
  status: BidStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateBidProps = {
  tenderId: string;
  bidderId: string;
  amount: number;
  proposal: string;
  deliveryDays: number;
  documentUrl?: string | null;
};

export type UpdateBidProps = {
  amount: number;
  proposal: string;
  deliveryDays: number;
  documentUrl?: string | null;
};

export interface BidWithTender extends Bid {
  tenderTitle: string;
  tenderReferenceNumber: string;
  tenderDeadline: Date;
  tenderStatus: string;
}

// Statuses where the bidder can still modify or withdraw
export const EDITABLE_BID_STATUSES: readonly BidStatus[] = [
  BidStatus.SUBMITTED,
  BidStatus.UNDER_REVIEW,
];
