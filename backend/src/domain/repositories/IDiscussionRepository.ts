import {
  Discussion,
  DiscussionWithAuthor,
  CreateDiscussionProps,
} from '../entities/Discussion';

export interface IDiscussionRepository {
  create(props: CreateDiscussionProps): Promise<Discussion>;
  findById(id: string): Promise<Discussion | null>;
  findByTender(tenderId: string): Promise<DiscussionWithAuthor[]>;
}
