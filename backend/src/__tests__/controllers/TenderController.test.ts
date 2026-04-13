import { Request, Response } from 'express';
import { TenderController } from '../../presentation/controllers/TenderController';
import { ListTenders } from '../../application/use-cases/tenders/ListTenders';
import { GetTenderById } from '../../application/use-cases/tenders/GetTenderById';
import { TenderStatus } from '../../domain/entities/Tender';

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('TenderController', () => {
  let listTenders: jest.Mocked<ListTenders>;
  let getTenderById: jest.Mocked<GetTenderById>;
  let controller: TenderController;

  beforeEach(() => {
    listTenders = { execute: jest.fn() } as any;
    getTenderById = { execute: jest.fn() } as any;
    controller = new TenderController(listTenders, getTenderById);
  });

  describe('list', () => {
    it('parses query filters and returns paginated result', async () => {
      const paginated = {
        items: [{ id: 't1', title: 'Tender 1' }],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      };
      listTenders.execute.mockResolvedValue(paginated as any);

      const req = {
        query: { page: '1', limit: '12' },
      } as unknown as Request;
      const res = mockRes();

      await controller.list(req, res);

      expect(listTenders.execute).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 12 })
      );
      expect(res.json).toHaveBeenCalledWith(paginated);
    });

    it('applies default page and limit when not provided', async () => {
      listTenders.execute.mockResolvedValue({ items: [], total: 0, page: 1, limit: 12, totalPages: 0 } as any);

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await controller.list(req, res);

      expect(listTenders.execute).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 12 })
      );
    });
  });

  describe('getById', () => {
    it('returns tender by id', async () => {
      const tender = { id: '550e8400-e29b-41d4-a716-446655440000', title: 'Test' };
      getTenderById.execute.mockResolvedValue(tender as any);

      const req = {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      } as unknown as Request;
      const res = mockRes();

      await controller.getById(req, res);

      expect(getTenderById.execute).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(res.json).toHaveBeenCalledWith(tender);
    });
  });
});
