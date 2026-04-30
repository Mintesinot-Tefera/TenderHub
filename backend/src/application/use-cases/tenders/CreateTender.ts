import { randomBytes } from 'crypto';
import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { TenderWithRelations } from '../../../domain/entities/Tender';
import { NotFoundError, ValidationError } from '../../../domain/errors/AppError';

interface CreateTenderInput {
  title: string;
  description: string;
  categoryId: string;
  organizationId: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  deadline: Date;
  location?: string | null;
  requirements?: string | null;
}

export class CreateTender {
  constructor(
    private readonly tenderRepo: ITenderRepository,
    private readonly categoryRepo: ICategoryRepository
  ) {}

  async execute(input: CreateTenderInput): Promise<TenderWithRelations> {
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) throw new NotFoundError('Category');

    if (input.deadline <= new Date()) {
      throw new ValidationError('Deadline must be in the future');
    }

    if (
      input.budgetMin != null &&
      input.budgetMax != null &&
      input.budgetMin > input.budgetMax
    ) {
      throw new ValidationError('Budget minimum cannot exceed maximum');
    }

    const year = new Date().getFullYear();
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    const referenceNumber = `TH-${year}-${suffix}`;

    return this.tenderRepo.create(input, referenceNumber);
  }
}
