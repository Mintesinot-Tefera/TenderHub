import { Bid, CreateBidProps, UpdateBidProps, BidWithTender, BidWithBidder, BidStatus } from '../entities/Bid';

export interface IBidRepository {
  create(props: CreateBidProps): Promise<Bid>;
  findById(id: string): Promise<Bid | null>;
  findByTenderAndBidder(tenderId: string, bidderId: string): Promise<Bid | null>;
  findByBidder(bidderId: string): Promise<BidWithTender[]>;
  findByTender(tenderId: string): Promise<BidWithBidder[]>;
  update(id: string, props: UpdateBidProps): Promise<Bid>;
  updateStatus(id: string, status: BidStatus): Promise<Bid>;
  withdraw(id: string): Promise<Bid>;
}
