import { GetTenderById } from '../../../application/use-cases/tenders/GetTenderById';
import { ListTenders } from '../../../application/use-cases/tenders/ListTenders';
import { ITenderRepository } from '../../../domain/repositories/ITenderRepository';
import { TenderStatus, TenderWithRelations, PaginatedTenders } from '../../../domain/entities/Tender';

const makeTenderWithRelations = (): TenderWithRelations => ({
  id: 't1',
  title: 'Test Tender',
  description: 'Description',
  referenceNumber: 'REF-001',
  categoryId: 'c1',
  organizationId: 'org1',
  budgetMin: 1000,
  budgetMax: 5000,
  deadline: new Date(),
  status: TenderStatus.OPEN,
  location: 'Addis Ababa',
  requirements: 'Some requirements',
  createdAt: new Date(),
  updatedAt: new Date(),
  categoryName: 'IT',
  categorySlug: 'it',
  organizationName: 'Org',
  bidCount: 3,
});

describe('GetTenderById', () => {
  let tenderRepo: jest.Mocked<ITenderRepository>;
  let useCase: GetTenderById;

  beforeEach(() => {
    tenderRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBasicById: jest.fn(),
    };
    useCase = new GetTenderById(tenderRepo);
  });

  it('returns tender with relations', async () => {
    const tender = makeTenderWithRelations();
    tenderRepo.findById.mockResolvedValue(tender);

    const result = await useCase.execute('t1');

    expect(tenderRepo.findById).toHaveBeenCalledWith('t1');
    expect(result.id).toBe('t1');
    expect(result.categoryName).toBe('IT');
    expect(result.bidCount).toBe(3);
  });

  it('throws 404 when tender does not exist', async () => {
    tenderRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});

describe('ListTenders', () => {
  let tenderRepo: jest.Mocked<ITenderRepository>;
  let useCase: ListTenders;

  beforeEach(() => {
    tenderRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBasicById: jest.fn(),
    };
    useCase = new ListTenders(tenderRepo);
  });

  it('passes filters to repository and returns paginated result', async () => {
    const paginated: PaginatedTenders = {
      items: [makeTenderWithRelations()],
      total: 1,
      page: 1,
      limit: 12,
      totalPages: 1,
    };
    tenderRepo.findAll.mockResolvedValue(paginated);

    const filters = { page: 1, limit: 12, status: TenderStatus.OPEN };
    const result = await useCase.execute(filters);

    expect(tenderRepo.findAll).toHaveBeenCalledWith(filters);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});
