import { Pool } from 'pg';
import { ITenderRepository } from '../../domain/repositories/ITenderRepository';
import {
  Tender,
  TenderWithRelations,
  TenderFilters,
  PaginatedTenders,
  TenderStatus,
} from '../../domain/entities/Tender';

interface TenderRow {
  id: string;
  title: string;
  description: string;
  reference_number: string;
  category_id: string;
  organization_id: string;
  budget_min: string | null;
  budget_max: string | null;
  deadline: Date;
  status: string;
  location: string | null;
  requirements: string | null;
  created_at: Date;
  updated_at: Date;
}

interface TenderJoinRow extends TenderRow {
  category_name: string;
  category_slug: string;
  organization_name: string;
  bid_count: string;
}

const parseNum = (v: string | null): number | null =>
  v === null ? null : parseFloat(v);

const mapBasic = (r: TenderRow): Tender => ({
  id: r.id,
  title: r.title,
  description: r.description,
  referenceNumber: r.reference_number,
  categoryId: r.category_id,
  organizationId: r.organization_id,
  budgetMin: parseNum(r.budget_min),
  budgetMax: parseNum(r.budget_max),
  deadline: r.deadline,
  status: r.status as TenderStatus,
  location: r.location,
  requirements: r.requirements,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapWithRelations = (r: TenderJoinRow): TenderWithRelations => ({
  ...mapBasic(r),
  categoryName: r.category_name,
  categorySlug: r.category_slug,
  organizationName: r.organization_name,
  bidCount: parseInt(r.bid_count, 10),
});

const SELECT_WITH_RELATIONS = `
  SELECT
    t.*,
    c.name AS category_name,
    c.slug AS category_slug,
    COALESCE(u.company_name, u.full_name) AS organization_name,
    (SELECT COUNT(*) FROM bids b WHERE b.tender_id = t.id) AS bid_count
  FROM tenders t
  JOIN categories c ON c.id = t.category_id
  JOIN users u ON u.id = t.organization_id
`;

export class PgTenderRepository implements ITenderRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(filters: TenderFilters): Promise<PaginatedTenders> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.search) {
      conditions.push(
        `(t.title ILIKE $${idx} OR t.description ILIKE $${idx} OR t.reference_number ILIKE $${idx})`
      );
      params.push(`%${filters.search}%`);
      idx++;
    }

    if (filters.categoryId) {
      conditions.push(`t.category_id = $${idx}`);
      params.push(filters.categoryId);
      idx++;
    }

    if (filters.status) {
      conditions.push(`t.status = $${idx}`);
      params.push(filters.status);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM tenders t ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const offset = (filters.page - 1) * filters.limit;
    const listParams = [...params, filters.limit, offset];

    const { rows } = await this.pool.query<TenderJoinRow>(
      `${SELECT_WITH_RELATIONS}
       ${where}
       ORDER BY t.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      listParams
    );

    return {
      items: rows.map(mapWithRelations),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async findById(id: string): Promise<TenderWithRelations | null> {
    const { rows } = await this.pool.query<TenderJoinRow>(
      `${SELECT_WITH_RELATIONS} WHERE t.id = $1`,
      [id]
    );
    return rows[0] ? mapWithRelations(rows[0]) : null;
  }

  async findBasicById(id: string): Promise<Tender | null> {
    const { rows } = await this.pool.query<TenderRow>(
      'SELECT * FROM tenders WHERE id = $1',
      [id]
    );
    return rows[0] ? mapBasic(rows[0]) : null;
  }
}
