import { Pool } from 'pg';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { Category } from '../../domain/entities/Category';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: Date;
}

const mapRow = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  description: r.description,
  createdAt: r.created_at,
});

export class PgCategoryRepository implements ICategoryRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Category[]> {
    const { rows } = await this.pool.query<CategoryRow>(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return rows.map(mapRow);
  }
}
