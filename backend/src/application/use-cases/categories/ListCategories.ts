import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { Category } from '../../../domain/entities/Category';

export class ListCategories {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(): Promise<Category[]> {
    return this.categoryRepo.findAll();
  }
}
