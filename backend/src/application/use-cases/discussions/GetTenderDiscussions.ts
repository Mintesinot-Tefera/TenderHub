import { IDiscussionRepository } from '../../../domain/repositories/IDiscussionRepository';
import { DiscussionThread, DiscussionWithAuthor } from '../../../domain/entities/Discussion';

export class GetTenderDiscussions {
  constructor(private readonly discussionRepo: IDiscussionRepository) {}

  async execute(tenderId: string): Promise<DiscussionThread[]> {
    const flat = await this.discussionRepo.findByTender(tenderId);

    // Group replies under their parent question. Rows are already ordered
    // chronologically, so replies stay in the order they were posted.
    const repliesByParent = new Map<string, DiscussionWithAuthor[]>();
    for (const d of flat) {
      if (d.parentId) {
        const list = repliesByParent.get(d.parentId) ?? [];
        list.push(d);
        repliesByParent.set(d.parentId, list);
      }
    }

    // Top-level questions newest-first
    return flat
      .filter((d) => d.parentId === null)
      .reverse()
      .map((q) => ({ ...q, replies: repliesByParent.get(q.id) ?? [] }));
  }
}
