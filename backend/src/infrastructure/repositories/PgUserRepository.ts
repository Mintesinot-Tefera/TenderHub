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
  email_verified: boolean;
  verification_token: string | null;
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
  emailVerified: r.email_verified,
  verificationToken: r.verification_token,
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

  async findByVerificationToken(token: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE verification_token = $1',
      [token]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(props: CreateUserProps): Promise<User> {
    const { rows } = await this.pool.query<UserRow>(
      `INSERT INTO users (email, password_hash, full_name, role, company_name, phone, avatar_url, email_verified, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        props.email,
        props.passwordHash,
        props.fullName,
        props.role,
        props.companyName,
        props.phone,
        props.avatarUrl,
        props.emailVerified,
        props.verificationToken,
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

  async verifyEmail(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE users SET email_verified = TRUE, verification_token = NULL, updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  }

  async setVerificationToken(userId: string, token: string): Promise<void> {
    await this.pool.query(
      `UPDATE users SET verification_token = $1, updated_at = NOW() WHERE id = $2`,
      [token, userId]
    );
  }
}
