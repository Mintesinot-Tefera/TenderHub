import { Request, Response } from 'express';
import { ListTenders } from '../../application/use-cases/tenders/ListTenders';
import { GetTenderById } from '../../application/use-cases/tenders/GetTenderById';
import { tenderQuerySchema, uuidParamSchema } from '../validators/schemas';

export class TenderController {
  constructor(
    private readonly listTenders: ListTenders,
    private readonly getTenderById: GetTenderById
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
}
