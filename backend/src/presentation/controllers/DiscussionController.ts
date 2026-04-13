import { Request, Response } from 'express';
import { PostDiscussion } from '../../application/use-cases/discussions/PostDiscussion';
import { GetTenderDiscussions } from '../../application/use-cases/discussions/GetTenderDiscussions';
import { postDiscussionSchema, uuidParamSchema } from '../validators/schemas';

export class DiscussionController {
  constructor(
    private readonly postDiscussion: PostDiscussion,
    private readonly getTenderDiscussions: GetTenderDiscussions
  ) {}

  listForTender = async (req: Request, res: Response): Promise<void> => {
    const { id: tenderId } = uuidParamSchema.parse(req.params);
    const threads = await this.getTenderDiscussions.execute(tenderId);
    res.json(threads);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { id: tenderId } = uuidParamSchema.parse(req.params);
    const body = postDiscussionSchema.parse(req.body);

    const discussion = await this.postDiscussion.execute({
      tenderId,
      userId: req.user!.userId,
      parentId: body.parentId,
      content: body.content,
    });

    res.status(201).json(discussion);
  };
}
