import { Request, Response } from 'express';
import { ListTenders } from '../../application/use-cases/tenders/ListTenders';
import { GetTenderById } from '../../application/use-cases/tenders/GetTenderById';
import { CreateTender } from '../../application/use-cases/tenders/CreateTender';
import { UpdateTender } from '../../application/use-cases/tenders/UpdateTender';
import { UpdateTenderStatus, TenderStatusAction } from '../../application/use-cases/tenders/UpdateTenderStatus';
import { ListMyTenders } from '../../application/use-cases/tenders/ListMyTenders';
import {
  tenderQuerySchema,
  uuidParamSchema,
  createTenderSchema,
  updateTenderStatusSchema,
} from '../validators/schemas';

export class TenderController {
  constructor(
    private readonly listTenders: ListTenders,
    private readonly getTenderById: GetTenderById,
    private readonly createTenderUC: CreateTender,
    private readonly updateTenderUC: UpdateTender,
    private readonly updateTenderStatusUC: UpdateTenderStatus,
    private readonly listMyTendersUC: ListMyTenders
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const filters = tenderQuerySchema.parse(req.query);
    const result = await this.listTenders.execute(filters);
    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const tender = await this.getTenderById.execute(id);
    res.json(tender);
  };

  myTenders = async (req: Request, res: Response): Promise<void> => {
    const tenders = await this.listMyTendersUC.execute(req.user!.userId);
    res.json(tenders);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createTenderSchema.parse(req.body);
    const tender = await this.createTenderUC.execute({
      ...body,
      organizationId: req.user!.userId,
    });
    res.status(201).json(tender);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const body = createTenderSchema.parse(req.body);
    const tender = await this.updateTenderUC.execute({
      tenderId: id,
      organizationId: req.user!.userId,
      ...body,
    });
    res.json(tender);
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const { action } = updateTenderStatusSchema.parse(req.body);
    const tender = await this.updateTenderStatusUC.execute({
      tenderId: id,
      organizationId: req.user!.userId,
      action: action as TenderStatusAction,
    });
    res.json(tender);
  };
}
