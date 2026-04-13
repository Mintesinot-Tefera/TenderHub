import { Request, Response } from 'express';
import { ListCategories } from '../../application/use-cases/categories/ListCategories';

export class CategoryController {
  constructor(private readonly listCategories: ListCategories) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const categories = await this.listCategories.execute();
    res.json(categories);
  };
}
