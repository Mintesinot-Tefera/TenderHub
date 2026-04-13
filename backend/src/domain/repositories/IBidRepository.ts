import { Bid, CreateBidProps, UpdateBidProps, BidWithTender } from '../entities/Bid';

export interface IBidRepository {
  create(props: CreateBidProps): Promise<Bid>;
  findById(id: string): Promise<Bid | null>;
  findByTenderAndBidder(tenderId: string, bidderId: string): Promise<Bid | null>;
  findByBidder(bidderId: string): Promise<BidWithTender[]>;
  update(id: string, props: UpdateBidProps): Promise<Bid>;
  withdraw(id: string): Promise<Bid>;
}
