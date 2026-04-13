import { IDiscussionRepository } from '../../../domain/repositories/IDiscussionRepository';
import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { Discussion } from '../../../domain/entities/Discussion';
import { NotFoundError, ValidationError } from '../../../domain/errors/AppError';

export interface PostDiscussionDTO {
  tenderId: string;
  userId: string;
  parentId?: string;
  content: string;
}

export class PostDiscussion {
  constructor(
    private readonly discussionRepo: IDiscussionRepository,
    private readonly tenderRepo: ITenderRepository
  ) {}

  async execute(dto: PostDiscussionDTO): Promise<Discussion> {
    const tender = await this.tenderRepo.findBasicById(dto.tenderId);
    if (!tender) {
      throw new NotFoundError('Tender');
    }

    let parentId: string | null = null;
    if (dto.parentId) {
      const parent = await this.discussionRepo.findById(dto.parentId);
      if (!parent || parent.tenderId !== dto.tenderId) {
        throw new NotFoundError('Parent discussion');
      }
      if (parent.parentId !== null) {
        throw new ValidationError('Replies can only be posted on top-level questions');
      }
      parentId = parent.id;
    }

    return this.discussionRepo.create({
      tenderId: dto.tenderId,
      userId: dto.userId,
      parentId,
      content: dto.content,
    });
  }
}
