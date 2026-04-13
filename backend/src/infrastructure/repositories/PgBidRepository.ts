import { Pool } from 'pg';
import { IBidRepository } from '../../domain/repositories/IBidRepository';
import {
  Bid,
  CreateBidProps,
  UpdateBidProps,
  BidStatus,
  BidWithTender,
} from '../../domain/entities/Bid';

interface BidRow {
  id: string;
  tender_id: string;
  bidder_id: string;
  amount: string;
  proposal: string;
  delivery_days: number;
  document_url: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface BidJoinRow extends BidRow {
  tender_title: string;
  tender_reference_number: string;
  tender_deadline: Date;
  tender_status: string;
}

const mapRow = (r: BidRow): Bid => ({
  id: r.id,
  tenderId: r.tender_id,
  bidderId: r.bidder_id,
  amount: parseFloat(r.amount),
  proposal: r.proposal,
  deliveryDays: r.delivery_days,
  documentUrl: r.document_url,
  status: r.status as BidStatus,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapWithTender = (r: BidJoinRow): BidWithTender => ({
  ...mapRow(r),
  tenderTitle: r.tender_title,
  tenderReferenceNumber: r.tender_reference_number,
  tenderDeadline: r.tender_deadline,
  tenderStatus: r.tender_status,
});

export class PgBidRepository implements IBidRepository {
  constructor(private readonly pool: Pool) {}

  async create(props: CreateBidProps): Promise<Bid> {
    const { rows } = await this.pool.query<BidRow>(
      `INSERT INTO bids (tender_id, bidder_id, amount, proposal, delivery_days, document_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [props.tenderId, props.bidderId, props.amount, props.proposal, props.deliveryDays, props.documentUrl ?? null]
    );
    return mapRow(rows[0]);
  }

  async findById(id: string): Promise<Bid | null> {
    const { rows } = await this.pool.query<BidRow>(
      'SELECT * FROM bids WHERE id = $1',
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByTenderAndBidder(tenderId: string, bidderId: string): Promise<Bid | null> {
    const { rows } = await this.pool.query<BidRow>(
      'SELECT * FROM bids WHERE tender_id = $1 AND bidder_id = $2',
      [tenderId, bidderId]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByBidder(bidderId: string): Promise<BidWithTender[]> {
    const { rows } = await this.pool.query<BidJoinRow>(
      `SELECT
         b.*,
         t.title AS tender_title,
         t.reference_number AS tender_reference_number,
         t.deadline AS tender_deadline,
         t.status AS tender_status
       FROM bids b
       JOIN tenders t ON t.id = b.tender_id
       WHERE b.bidder_id = $1
       ORDER BY b.created_at DESC`,
      [bidderId]
    );
    return rows.map(mapWithTender);
  }

  async update(id: string, props: UpdateBidProps): Promise<Bid> {
    const { rows } = await this.pool.query<BidRow>(
      `UPDATE bids
       SET amount = $2, proposal = $3, delivery_days = $4,
           document_url = COALESCE($5, document_url),
           status = 'SUBMITTED', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, props.amount, props.proposal, props.deliveryDays, props.documentUrl ?? null]
    );
    return mapRow(rows[0]);
  }

  async withdraw(id: string): Promise<Bid> {
    const { rows } = await this.pool.query<BidRow>(
      `UPDATE bids
       SET status = 'WITHDRAWN', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return mapRow(rows[0]);
  }
}
