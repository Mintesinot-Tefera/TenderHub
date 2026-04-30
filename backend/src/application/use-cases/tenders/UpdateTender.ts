import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { TenderWithRelations, TenderStatus } from '../../../domain/entities/Tender';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../domain/errors/AppError';

interface UpdateTenderInput {
  tenderId: string;
  organizationId: string;
  title: string;
  description: string;
  categoryId: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  deadline: Date;
  location?: string | null;
  requirements?: string | null;
}

export class UpdateTender {
  constructor(
    private readonly tenderRepo: ITenderRepository,
    private readonly categoryRepo: ICategoryRepository
  ) {}

  async execute(input: UpdateTenderInput): Promise<TenderWithRelations> {
    const tender = await this.tenderRepo.findBasicById(input.tenderId);
    if (!tender) throw new NotFoundError('Tender');

    if (tender.organizationId !== input.organizationId) {
      throw new ForbiddenError('You can only edit your own tenders');
    }

    if (tender.status !== TenderStatus.OPEN) {
      throw new ValidationError('Only open tenders can be edited');
    }

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

    return this.tenderRepo.update(input.tenderId, {
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      deadline: input.deadline,
      location: input.location,
      requirements: input.requirements,
    });
  }
}
