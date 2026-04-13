import { Pool } from 'pg';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, CreateUserProps, UpdateUserProps, UserRole } from '../../domain/entities/User';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

const mapRow = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  passwordHash: r.password_hash,
  fullName: r.full_name,
  role: r.role as UserRole,
  companyName: r.company_name,
  phone: r.phone,
  avatarUrl: r.avatar_url,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export class PgUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(props: CreateUserProps): Promise<User> {
    const { rows } = await this.pool.query<UserRow>(
      `INSERT INTO users (email, password_hash, full_name, role, company_name, phone, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        props.email,
        props.passwordHash,
        props.fullName,
        props.role,
        props.companyName,
        props.phone,
        props.avatarUrl,
      ]
    );
    return mapRow(rows[0]);
  }

  async update(id: string, props: UpdateUserProps): Promise<User> {
    const { rows } = await this.pool.query<UserRow>(
      `UPDATE users
       SET full_name = $2, company_name = $3, phone = $4, avatar_url = $5,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, props.fullName, props.companyName, props.phone, props.avatarUrl]
    );
    return mapRow(rows[0]);
  }
}
