export interface SubmitBidDTO {
  tenderId: string;
  bidderId: string;
  amount: number;
  proposal: string;
  deliveryDays: number;
  documentUrl?: string | null;
}
