import { Pool } from 'pg';
import { IDiscussionRepository } from '../../domain/repositories/IDiscussionRepository';
import {
  Discussion,
  DiscussionWithAuthor,
  CreateDiscussionProps,
} from '../../domain/entities/Discussion';
import { UserRole } from '../../domain/entities/User';

interface DiscussionRow {
  id: string;
  tender_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: Date;
  updated_at: Date;
}

interface DiscussionJoinRow extends DiscussionRow {
  author_name: string;
  author_role: string;
  author_avatar_url: string | null;
}

const mapRow = (r: DiscussionRow): Discussion => ({
  id: r.id,
  tenderId: r.tender_id,
  userId: r.user_id,
  parentId: r.parent_id,
  content: r.content,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapWithAuthor = (r: DiscussionJoinRow): DiscussionWithAuthor => ({
  ...mapRow(r),
  authorName: r.author_name,
  authorRole: r.author_role as UserRole,
  authorAvatarUrl: r.author_avatar_url,
});

export class PgDiscussionRepository implements IDiscussionRepository {
  constructor(private readonly pool: Pool) {}

  async create(props: CreateDiscussionProps): Promise<Discussion> {
    const { rows } = await this.pool.query<DiscussionRow>(
      `INSERT INTO discussions (tender_id, user_id, parent_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [props.tenderId, props.userId, props.parentId, props.content]
    );
    return mapRow(rows[0]);
  }

  async findById(id: string): Promise<Discussion | null> {
    const { rows } = await this.pool.query<DiscussionRow>(
      'SELECT * FROM discussions WHERE id = $1',
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByTender(tenderId: string): Promise<DiscussionWithAuthor[]> {
    const { rows } = await this.pool.query<DiscussionJoinRow>(
      `SELECT
         d.*,
         u.full_name AS author_name,
         u.role AS author_role,
         u.avatar_url AS author_avatar_url
       FROM discussions d
       JOIN users u ON u.id = d.user_id
       WHERE d.tender_id = $1
       ORDER BY d.created_at ASC`,
      [tenderId]
    );
    return rows.map(mapWithAuthor);
  }
}
