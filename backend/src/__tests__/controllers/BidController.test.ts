import { Request, Response } from 'express';
import { BidController } from '../../presentation/controllers/BidController';
import { SubmitBid } from '../../application/use-cases/bids/SubmitBid';
import { GetMyBids } from '../../application/use-cases/bids/GetMyBids';
import { UpdateBid } from '../../application/use-cases/bids/UpdateBid';
import { WithdrawBid } from '../../application/use-cases/bids/WithdrawBid';
import { BidStatus } from '../../domain/entities/Bid';

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('BidController', () => {
  let submitBid: jest.Mocked<SubmitBid>;
  let getMyBids: jest.Mocked<GetMyBids>;
  let updateBid: jest.Mocked<UpdateBid>;
  let withdrawBid: jest.Mocked<WithdrawBid>;
  let controller: BidController;

  beforeEach(() => {
    submitBid = { execute: jest.fn() } as any;
    getMyBids = { execute: jest.fn() } as any;
    updateBid = { execute: jest.fn() } as any;
    withdrawBid = { execute: jest.fn() } as any;
    controller = new BidController(submitBid, getMyBids, updateBid, withdrawBid);
  });

  describe('submit', () => {
    it('creates bid and returns 201', async () => {
      const bid = { id: 'b1', status: BidStatus.SUBMITTED };
      submitBid.execute.mockResolvedValue(bid as any);

      const req = {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
        body: {
          amount: 5000,
          proposal: 'A detailed proposal text here for testing purposes',
          deliveryDays: 30,
        },
        user: { userId: 'bidder1' },
        file: undefined,
      } as unknown as Request;
      const res = mockRes();

      await controller.submit(req, res);

      expect(submitBid.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          tenderId: '550e8400-e29b-41d4-a716-446655440000',
          bidderId: 'bidder1',
          amount: 5000,
          deliveryDays: 30,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(bid);
    });

    it('includes documentUrl when file is uploaded', async () => {
      const bid = { id: 'b1', documentUrl: '/uploads/proposals/test.pdf' };
      submitBid.execute.mockResolvedValue(bid as any);

      const req = {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
        body: {
          amount: 5000,
          proposal: 'A detailed proposal text here for testing purposes',
          deliveryDays: 30,
        },
        user: { userId: 'bidder1' },
        file: { filename: 'test.pdf' },
      } as unknown as Request;
      const res = mockRes();

      await controller.submit(req, res);

      expect(submitBid.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          documentUrl: '/uploads/proposals/test.pdf',
        })
      );
    });
  });

  describe('myBids', () => {
    it('returns bids for the authenticated user', async () => {
      const bids = [{ id: 'b1' }, { id: 'b2' }];
      getMyBids.execute.mockResolvedValue(bids as any);

      const req = { user: { userId: 'bidder1' } } as unknown as Request;
      const res = mockRes();

      await controller.myBids(req, res);

      expect(getMyBids.execute).toHaveBeenCalledWith('bidder1');
      expect(res.json).toHaveBeenCalledWith(bids);
    });
  });

  describe('update', () => {
    it('updates bid and returns result', async () => {
      const bid = { id: 'b1', amount: 6000 };
      updateBid.execute.mockResolvedValue(bid as any);

      const req = {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
        body: {
          amount: 6000,
          proposal: 'Updated proposal text here for testing purposes',
          deliveryDays: 20,
        },
        user: { userId: 'bidder1' },
        file: undefined,
      } as unknown as Request;
      const res = mockRes();

      await controller.update(req, res);

      expect(updateBid.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          bidId: '550e8400-e29b-41d4-a716-446655440000',
          bidderId: 'bidder1',
          amount: 6000,
        })
      );
      expect(res.json).toHaveBeenCalledWith(bid);
    });
  });

  describe('withdraw', () => {
    it('withdraws bid', async () => {
      const bid = { id: 'b1', status: BidStatus.WITHDRAWN };
      withdrawBid.execute.mockResolvedValue(bid as any);

      const req = {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
        user: { userId: 'bidder1' },
      } as unknown as Request;
      const res = mockRes();

      await controller.withdraw(req, res);

      expect(withdrawBid.execute).toHaveBeenCalledWith({
        bidId: '550e8400-e29b-41d4-a716-446655440000',
        bidderId: 'bidder1',
      });
      expect(res.json).toHaveBeenCalledWith(bid);
    });
  });
});
