import { Request, Response } from 'express';
import { SubmitBid } from '../../application/use-cases/bids/SubmitBid';
import { GetMyBids } from '../../application/use-cases/bids/GetMyBids';
import { UpdateBid } from '../../application/use-cases/bids/UpdateBid';
import { WithdrawBid } from '../../application/use-cases/bids/WithdrawBid';
import { submitBidSchema, uuidParamSchema } from '../validators/schemas';

export class BidController {
  constructor(
    private readonly submitBid: SubmitBid,
    private readonly getMyBids: GetMyBids,
    private readonly updateBid: UpdateBid,
    private readonly withdrawBid: WithdrawBid
  ) {}

  submit = async (req: Request, res: Response): Promise<void> => {
    const { id: tenderId } = uuidParamSchema.parse(req.params);
    const body = submitBidSchema.parse(req.body);

    const documentUrl = req.file ? `/uploads/proposals/${req.file.filename}` : undefined;

    const bid = await this.submitBid.execute({
      tenderId,
      bidderId: req.user!.userId,
      amount: body.amount,
      proposal: body.proposal,
      deliveryDays: body.deliveryDays,
      documentUrl,
    });

    res.status(201).json(bid);
  };

  myBids = async (req: Request, res: Response): Promise<void> => {
    const bids = await this.getMyBids.execute(req.user!.userId);
    res.json(bids);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const body = submitBidSchema.parse(req.body);

    const documentUrl = req.file ? `/uploads/proposals/${req.file.filename}` : undefined;

    const bid = await this.updateBid.execute({
      bidId: id,
      bidderId: req.user!.userId,
      amount: body.amount,
      proposal: body.proposal,
      deliveryDays: body.deliveryDays,
      documentUrl,
    });

    res.json(bid);
  };

  withdraw = async (req: Request, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);

    const bid = await this.withdrawBid.execute({
      bidId: id,
      bidderId: req.user!.userId,
    });

    res.json(bid);
  };
}
