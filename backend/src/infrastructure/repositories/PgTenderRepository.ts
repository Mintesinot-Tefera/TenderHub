import { Pool } from 'pg';
import { ITenderRepository } from '../../domain/repositories/ITenderRepository';
import {
  Tender,
  TenderWithRelations,
  TenderFilters,
  PaginatedTenders,
  TenderStatus,
  CreateTenderProps,
  UpdateTenderProps,
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

  async findByOrganization(organizationId: string): Promise<TenderWithRelations[]> {
    const { rows } = await this.pool.query<TenderJoinRow>(
      `${SELECT_WITH_RELATIONS}
       WHERE t.organization_id = $1
       ORDER BY t.created_at DESC`,
      [organizationId]
    );
    return rows.map(mapWithRelations);
  }

  async create(props: CreateTenderProps, referenceNumber: string): Promise<TenderWithRelations> {
    const { rows } = await this.pool.query<TenderRow>(
      `INSERT INTO tenders
         (title, description, reference_number, category_id, organization_id,
          budget_min, budget_max, deadline, location, requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        props.title,
        props.description,
        referenceNumber,
        props.categoryId,
        props.organizationId,
        props.budgetMin ?? null,
        props.budgetMax ?? null,
        props.deadline,
        props.location ?? null,
        props.requirements ?? null,
      ]
    );
    return (await this.findById(rows[0].id))!;
  }

  async update(id: string, props: UpdateTenderProps): Promise<TenderWithRelations> {
    await this.pool.query(
      `UPDATE tenders
       SET title = $2, description = $3, category_id = $4,
           budget_min = $5, budget_max = $6, deadline = $7,
           location = $8, requirements = $9, updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        props.title,
        props.description,
        props.categoryId,
        props.budgetMin ?? null,
        props.budgetMax ?? null,
        props.deadline,
        props.location ?? null,
        props.requirements ?? null,
      ]
    );
    return (await this.findById(id))!;
  }

  async updateStatus(id: string, status: TenderStatus): Promise<Tender> {
    const { rows } = await this.pool.query<TenderRow>(
      `UPDATE tenders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return mapBasic(rows[0]);
  }
}
