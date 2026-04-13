import { UserRole } from './User';

export interface Discussion {
  id: string;
  tenderId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscussionWithAuthor extends Discussion {
  authorName: string;
  authorRole: UserRole;
  authorAvatarUrl: string | null;
}

export interface DiscussionThread extends DiscussionWithAuthor {
  replies: DiscussionWithAuthor[];
}

export interface CreateDiscussionProps {
  tenderId: string;
  userId: string;
  parentId: string | null;
  content: string;
}
