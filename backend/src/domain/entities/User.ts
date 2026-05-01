export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZATION = 'ORGANIZATION',
  BIDDER = 'BIDDER',
}

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  fullName: string;
  role: UserRole;
  companyName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  verificationToken: string | null;
  googleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserProps = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;


export type UpdateUserProps = {
  fullName: string;
  companyName: string | null;
  phone: string | null;
  avatarUrl: string | null;
};

export type PublicUser = Omit<User, 'passwordHash' | 'googleId'>;

export const toPublicUser = (user: User): PublicUser => {
  const { passwordHash, googleId, ...rest } = user;
  return rest;
};
